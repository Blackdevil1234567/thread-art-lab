import numpy as np
import cv2
import math
import random
import time

LINE_CACHE = {}

def get_pin_coords(num_pins, radius, center_x, center_y):
    coords = []
    for i in range(num_pins):
        angle = 2 * math.pi * i / num_pins - math.pi/2
        x = int(center_x + radius * math.cos(angle))
        y = int(center_y + radius * math.sin(angle))
        coords.append((x, y))
    return coords

def get_pin_coords_square(num_pins, radius, center_x, center_y):
    coords = []
    for i in range(num_pins):
        dist = i * (8 * radius) / num_pins
        if dist < 2 * radius:
            x = center_x - radius + dist
            y = center_y - radius
        elif dist < 4 * radius:
            x = center_x + radius
            y = center_y - radius + (dist - 2 * radius)
        elif dist < 6 * radius:
            x = center_x + radius - (dist - 4 * radius)
            y = center_y + radius
        else:
            x = center_x - radius
            y = center_y + radius - (dist - 6 * radius)
        coords.append((int(x), int(y)))
    return coords

def create_circular_mask(h, w):
    center = (int(w/2), int(h/2))
    radius = min(center[0], center[1], w-center[0], h-center[1])
    Y, X = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((X - center[0])**2 + (Y-center[1])**2)
    return dist_from_center <= radius

def apply_s_curve(img):
    """
    Apply a smoother S-curve to preserve mid-tones while pushing highlights.
    """
    # Using a gentler power curve (2.0 instead of 3.5) and removing the hard jump at 180
    inv_lut = np.array([
        np.clip(255 * pow(i / 255.0, 1.8), 0, 255)
        for i in range(256)
    ]).astype("uint8")
    return cv2.LUT(img, inv_lut)

def preprocess_image(image_bgr, contrast=1.0, brightness=0, enhance_clahe=True, shape="circle"):
    size = 500
    resized = cv2.resize(image_bgr, (size, size))
    
    # 1. Apply manual contrast and brightness
    adjusted = cv2.convertScaleAbs(resized, alpha=contrast, beta=brightness)
    
    # 2. Apply Extreme S-Curve to push highlights to white and ignore mid-tones
    # This ensures the algorithm ONLY sees the darkest features
    adjusted = apply_s_curve(adjusted)
    
    # 3. Enhance features with CLAHE
    if enhance_clahe:
        lab = cv2.cvtColor(adjusted, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4,4))
        cl = clahe.apply(l)
        limg = cv2.merge((cl,a,b))
        adjusted = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    if shape == "circle":
        mask = create_circular_mask(size, size)
    else:
        mask = np.ones((size, size), dtype=bool)
        
    gray = cv2.cvtColor(adjusted, cv2.COLOR_BGR2GRAY)
    inverted = 255 - gray
    
    # --- HIGHLIGHT PRESERVATION (NEW) ---
    # If a pixel was originally very bright (like blonde hair), we reduce its intensity
    # in the inverted target to prevent it from stealing focus from the face.
    original_gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    highlights = cv2.GaussianBlur(original_gray, (21, 21), 0)
    # Reduce intensity of things that were > 200 in the original image
    highlight_mask = np.clip((highlights.astype(float) - 180) / 75.0, 0, 1)
    inverted = (inverted.astype(float) * (1.0 - highlight_mask * 0.7)).astype(np.uint8)
    
    # Noise reduction: remove very low intensity pixels (background washout)
    inverted[inverted < 20] = 0
    
    inverted[~mask] = 0
    return inverted, mask, adjusted

def get_all_line_indices(num_pins, pin_coords, shape):
    global LINE_CACHE
    cache_key = (num_pins, shape)
    
    if cache_key in LINE_CACHE:
        return LINE_CACHE[cache_key]
        
    print(f"Precomputing {num_pins * (num_pins-1) // 2} line paths for cache...")
    size = 500
    all_indices = {}
    
    # We only compute once per pin pair
    # Using dictionary[p1][p2] = (y_indices, x_indices)
    for i in range(num_pins):
        all_indices[i] = {}
        for j in range(num_pins):
            if i == j: continue
            
            # Simple line drawing once to get indices
            mask = np.zeros((size, size), dtype=np.uint8)
            cv2.line(mask, pin_coords[i], pin_coords[j], 1, 1)
            y, x = np.where(mask == 1)
            all_indices[i][j] = (y, x)
            
    LINE_CACHE[cache_key] = all_indices
    return all_indices

def get_line_score_cv(img, pt1, pt2, line_mask_cache):
    if (pt1, pt2) in line_mask_cache:
        mask = line_mask_cache[(pt1, pt2)]
    elif (pt2, pt1) in line_mask_cache:
        mask = line_mask_cache[(pt2, pt1)]
    else:
        mask = np.zeros_like(img, dtype=np.uint8)
        cv2.line(mask, pt1, pt2, 255, 1)
        line_mask_cache[(pt1, pt2)] = mask
    return mask

def generate_greedy(inverted, pin_coords, num_pins, num_lines, line_weight, auto_stop=True, shape="circle", dynamic_limit=False):
    sequence = [0]
    current_pin = 0
    img = inverted.copy().astype(np.int16)

    # Auto-adjust line weight for very high counts to avoid "muddy" results
    if num_lines > 3000:
        line_weight = max(2, line_weight // 2)
        
    # Initialize auto-stop and weaving trackers
    initial_avg = 0
    rolling_avg = 0
    plateau_count = 0
    initial_total_intensity = np.sum(img)
    angle_history = [] # Keep track of recent line angles
    
    # Get precomputed line indices (this is the massive speedup)
    all_line_indices = get_all_line_indices(num_pins, pin_coords, shape)
    
    for iteration in range(num_lines):
        best_score = -1
        best_pin = -1
        
        # Search for the best line from the current pin
        for p in range(num_pins):
            # Constraint: Avoid target pins that are too close (prevents messy clustering)
            # We enforce a minimum gap to avoid vertical banding, but not so much that we lose detail
            pin_gap = min(abs(p - current_pin), num_pins - abs(p - current_pin))
            if pin_gap < 12:
                continue
            
            y, x = all_line_indices[current_pin][p]
            score = np.sum(img[y, x])
            
            # --- ANGULAR WEAVING PENALTY (NEW) ---
            # Calculate the angle of this potential line
            angle = math.atan2(pin_coords[p][1] - pin_coords[current_pin][1], 
                               pin_coords[p][0] - pin_coords[current_pin][0]) % math.pi
            
            # Penalize if this angle is too similar to the last few lines
            # This prevents horizontal "scanning" or vertical "cages"
            for prev_angle in angle_history[-15:]:
                angle_diff = abs(angle - prev_angle)
                if angle_diff < 0.15: # Approx 8 degrees
                    score *= 0.6
                elif angle_diff < 0.3: # Approx 17 degrees
                    score *= 0.8
            
            # Strict penalty for immediate reversal
            if len(sequence) > 1 and p == sequence[-2]:
                score *= 0.3
                
            if score > best_score:
                best_score = score
                best_pin = p
                best_angle = angle
                
        if best_pin == -1 or best_score <= 10:
            break
            
        # Update angle history
        angle_history.append(best_angle)
        if len(angle_history) > 20:
            angle_history.pop(0)

        # Record initial average for absolute cutoff
        if iteration < 50:
            initial_avg = (initial_avg * iteration + best_score) / (iteration + 1) if iteration > 0 else best_score
        
        # Track rolling average for plateau detection
        if iteration == 0:
            rolling_avg = best_score
        else:
            rolling_avg = 0.95 * rolling_avg + 0.05 * best_score # Slower decay
            
        # --- INTELLIGENT AUTO-STOP (NEW) ---
        if auto_stop and iteration > 300: # Give it some runway
            # 1. Total Saturation Check
            current_intensity = np.sum(img)
            intensity_ratio = current_intensity / initial_total_intensity
            
            if iteration % 100 == 0:
                print(f"  [Trace] Step {iteration}: best_score={best_score:.1f}, intensity_ratio={intensity_ratio:.3f}", flush=True)

            # STOP if image is 80% covered (20% remaining intensity)
            if intensity_ratio < 0.20:
                print(f"  [Auto-Stop] Contrast Saturation reached ({iteration} lines).", flush=True)
                break

            # 2. Diminishing Returns (Derivative Check)
            # If line quality drops below 10% of the first line, stop.
            if best_score < (initial_avg * 0.10):
                print(f"  [Auto-Stop] Quality limit reached ({iteration} lines).", flush=True)
                break
            
            # 3. Hard Portrait Limit (Monochrome)
            # Only applied if NOT in dynamic mode
            if not dynamic_limit and iteration > 12000:
                print(f"  [Auto-Stop] Hard Portrait Limit reached (12000 lines).", flush=True)
                break
            
            # 4. Plateau Detection
            if best_score < (rolling_avg * 0.7):
                plateau_count += 1
            else:
                plateau_count = 0
            
            if plateau_count > 10:
                print(f"  [Auto-Stop] Plateau detected: quality dropped too fast.", flush=True)
                break

        # Subtract line weight from the target image using precomputed indices
        y, x = all_line_indices[current_pin][best_pin]
        img[y, x] -= line_weight
        # Clip specifically to keep it from going negative
        img = np.maximum(img, 0)
        
        sequence.append(best_pin)
        current_pin = best_pin
        
    print(f"  Algorithm finished. Total lines: {len(sequence)-1}", flush=True)
    return sequence

def render_sequence(shape, pin_coords, sequence, line_weight):
    canvas = np.zeros(shape, dtype=np.int32)
    for i in range(1, len(sequence)):
        pt1 = pin_coords[sequence[i-1]]
        pt2 = pin_coords[sequence[i]]
        cv2.line(canvas, pt1, pt2, line_weight, 1)
    return np.clip(canvas, 0, 255).astype(np.uint8)

def compute_fitness(target, rendered):
    mse = np.mean((target.astype(np.float32) - rendered.astype(np.float32))**2)
    return -mse

def mutate_sequence(sequence, num_pins, mutation_rate=0.05):
    new_seq = sequence.copy()
    num_mutations = max(1, int(len(sequence) * mutation_rate))
    for _ in range(num_mutations):
        idx = random.randint(1, len(sequence)-1)
        new_seq[idx] = random.randint(0, num_pins-1)
    return new_seq

def generate_genetic(inverted, pin_coords, num_pins, num_lines, line_weight, generations=50, population_size=10):
    base_sequence = generate_greedy(inverted, pin_coords, num_pins, num_lines, line_weight)
    
    population = [base_sequence]
    for _ in range(population_size - 1):
        population.append(mutate_sequence(base_sequence, num_pins, mutation_rate=0.1))
        
    for generation in range(generations):
        fitnesses = []
        for seq in population:
            rendered = render_sequence(inverted.shape, pin_coords, seq, line_weight)
            fit = compute_fitness(inverted, rendered)
            fitnesses.append(fit)
            
        sorted_indices = np.argsort(fitnesses)[::-1]
        best_seq = population[sorted_indices[0]]
        
        new_population = [best_seq]
        
        while len(new_population) < population_size:
            i1 = random.choice(sorted_indices[:population_size//2])
            i2 = random.choice(sorted_indices[:population_size//2])
            parent1 = population[i1]
            parent2 = population[i2]
            
            crossover_point = random.randint(1, num_lines - 1)
            child = parent1[:crossover_point] + parent2[crossover_point:]
            
            if random.random() < 0.5:
                child = mutate_sequence(child, num_pins, 0.05)
                
            new_population.append(child)
            
        population = new_population

    return population[0]

def generate_thread_art(image_bgr, num_pins=200, num_lines=1000, line_weight=10, algorithm="greedy", mode="preview", shape="circle", color_mode="bw", auto_stop=True, contrast=1.0, brightness=0, enhance_contrast=True, cmy_intensity=None, dynamic_limit=False):
    if cmy_intensity is None:
        cmy_intensity = {"c": 100, "m": 100, "y": 100, "k": 100}

    # Dynamic Mode Overrides
    if dynamic_limit:
        num_lines = 50000 # Safety Cap
        auto_stop = True
    # Preprocess image as a single channel target (inverted for the algorithm)
    # If color_mode is 'color', we'll re-process per channel below if needed, 
    # but let's stick to the base preprocessing parameters.
    
    size = 500
    inverted_target, mask, processed_bgr = preprocess_image(image_bgr, contrast, brightness, enhance_contrast, shape)
    
    # We need pin coords for the generator
    center_x, center_y = size // 2, size // 2
    radius = size // 2 - 1
    
    if shape == "circle":
        pin_coords = get_pin_coords(num_pins, radius, center_x, center_y)
    else:
        pin_coords = get_pin_coords_square(num_pins, radius, center_x, center_y)
        
    def process_channel_data(inverted_chan):
        if algorithm == "genetic":
            generations = 5 if mode == "preview" else 20
            population = 5 if mode == "preview" else 15
            return generate_genetic(inverted_chan, pin_coords, num_pins, num_lines, line_weight, generations=generations, population_size=population)
        else:
            limit = min(num_lines, 1500) if mode == "preview" and not dynamic_limit else num_lines
            return generate_greedy(inverted_chan, pin_coords, num_pins, limit, line_weight, auto_stop=auto_stop, shape=shape, dynamic_limit=dynamic_limit)

    if color_mode in ["color", "cmyk"]:
        # For color, we redo preprocessing per channel to get accurate separation
        B_img, G_img, R_img = cv2.split(processed_bgr)
        B, G, R = B_img/255.0, G_img/255.0, R_img/255.0
        
        # CMY Inversion targets (0 to 1 range)
        C = 1.0 - R
        M = 1.0 - G
        Y = 1.0 - B
        
        if color_mode == "cmyk":
            K = np.minimum(np.minimum(C, M), Y)
            # Art-Mix: Don't subtract 100% of K, leave 30% for color layering
            # This prevents the CMY threads from being zeroed out in shadows
            mix_factor = 0.7 
            not_pure_black = (K * mix_factor) < 1.0
            
            C[not_pure_black] = (C[not_pure_black] - K[not_pure_black] * mix_factor) / (1.0 - K[not_pure_black] * mix_factor)
            M[not_pure_black] = (M[not_pure_black] - K[not_pure_black] * mix_factor) / (1.0 - K[not_pure_black] * mix_factor)
            Y[not_pure_black] = (Y[not_pure_black] - K[not_pure_black] * mix_factor) / (1.0 - K[not_pure_black] * mix_factor)
            
            C[~not_pure_black] = 0
            M[~not_pure_black] = 0
            Y[~not_pure_black] = 0
            tar_k = (K * 255).astype(np.uint8)
            tar_k[~mask] = 0

            # --- ARTISTIC VIBRANCY BOOST (NEW) ---
            # If the image is monochromatic (or low saturation), K will have 
            # drained the C,M,Y channels. We FORCE them to pop using 
            # Spectral Depth Mapping.
            L = (processed_bgr.astype(float) / 255.0).sum(axis=2) / 3.0 # Luma
            
            # Map Yellow to Highlights, Cyan to mid-tones, Magenta to deeper mid-tones
            yellow_mask = np.clip((L - 0.5) * 2.0, 0, 1) # Brightest 50%
            cyan_mask = 1.0 - np.abs(L - 0.5) * 2.0      # Middle 50%
            magenta_mask = np.clip((0.5 - L) * 2.0, 0, 1) # Darkest 50%
            
            # Apply masks and BOOST saturation by 1.8x
            saturation_boost = 1.8
            tar_c = (C * 255 * cyan_mask * saturation_boost).clip(0, 255).astype(np.uint8)
            tar_m = (M * 255 * magenta_mask * saturation_boost).clip(0, 255).astype(np.uint8)
            tar_y = (Y * 255 * yellow_mask * saturation_boost).clip(0, 255).astype(np.uint8)
            # ---------------------------------------
        else:
            tar_k = None
            tar_c = (C * 255).astype(np.uint8)
            tar_m = (M * 255).astype(np.uint8)
            tar_y = (Y * 255).astype(np.uint8)

        tar_c[~mask] = 0
        tar_m[~mask] = 0
        tar_y[~mask] = 0
        
        # Normalization: Ensure all three channels share a balanced intensity range.
        shared_max = max(np.max(tar_c), np.max(tar_m), np.max(tar_y))
        if shared_max > 0:
            tar_c = (tar_c / shared_max * 255 * (cmy_intensity.get('c', 100) / 100)).astype(np.uint8)
            tar_m = (tar_m / shared_max * 255 * (cmy_intensity.get('m', 100) / 100)).astype(np.uint8)
            tar_y = (tar_y / shared_max * 255 * (cmy_intensity.get('y', 100) / 100)).astype(np.uint8)
        
        # Normalize K separately if it exists
        if tar_k is not None:
             tar_k = (tar_k * (cmy_intensity.get('k', 100) / 100)).clip(0, 255).astype(np.uint8)

        results = [
            {"color": "#00FFFF", "pins": process_channel_data(tar_c)},
            {"color": "#FF00FF", "pins": process_channel_data(tar_m)},
            {"color": "#FFFF00", "pins": process_channel_data(tar_y)}
        ]
        
        if tar_k is not None:
            results.append({"color": "#000000", "pins": process_channel_data(tar_k)})
            
        return results
    else:
        return [{"color": "default", "pins": process_channel_data(inverted_target)}]
