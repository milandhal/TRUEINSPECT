-- =============================================================================
-- TRUEINSPECT - Repair Cost Master Reference Template
-- Database: trueinspect_db
-- 
-- NOTE: These values are project reference benchmark values only and must 
-- NOT be presented as official manufacturer prices.
-- All costs are in INR (₹).
-- =============================================================================

USE trueinspect_db;

-- Clear previous template data if needed (optional)
-- TRUNCATE TABLE repair_cost_master;

INSERT INTO repair_cost_master 
(component, defect_type, severity, action, min_cost, max_cost, currency, active)
VALUES
-- Front Door
('Front Door', 'Dent', 'Minor', 'Paintless Dent Removal (PDR)', 1200.00, 1800.00, 'INR', TRUE),
('Front Door', 'Dent', 'Moderate', 'Dent pulling, body filler & panel repaint', 3500.00, 4500.00, 'INR', TRUE),
('Front Door', 'Dent', 'Major', 'Major panel repair / skin replacement & full repaint', 6500.00, 9500.00, 'INR', TRUE),
('Front Door', 'Scratch', 'Minor', 'Surface rubbing & high-gloss machine polish', 600.00, 1000.00, 'INR', TRUE),
('Front Door', 'Scratch', 'Moderate', 'Deep scratch scratch-fill & partial blend painting', 1800.00, 2600.00, 'INR', TRUE),
('Front Door', 'Scratch', 'Major', 'Metal-depth scratch primer treatment & full door refinish', 3800.00, 5000.00, 'INR', TRUE),

-- Rear Door
('Rear Door', 'Dent', 'Minor', 'Paintless Dent Removal (PDR)', 1200.00, 1800.00, 'INR', TRUE),
('Rear Door', 'Dent', 'Moderate', 'Dent pulling & panel repaint', 3500.00, 4500.00, 'INR', TRUE),
('Rear Door', 'Dent', 'Major', 'Extensive door repair & full repaint', 6500.00, 9000.00, 'INR', TRUE),
('Rear Door', 'Scratch', 'Minor', 'Compound buffing & surface polishing', 600.00, 1000.00, 'INR', TRUE),
('Rear Door', 'Scratch', 'Moderate', 'Basecoat touch-up & localized clear coat blend', 1800.00, 2600.00, 'INR', TRUE),
('Rear Door', 'Scratch', 'Major', 'Full door panel respray with clear coat baking', 3800.00, 4800.00, 'INR', TRUE),

-- Front Bumper
('Front Bumper', 'Dent', 'Minor', 'Plastic bumper heat shaping & alignment', 1000.00, 1500.00, 'INR', TRUE),
('Front Bumper', 'Dent', 'Moderate', 'Heat reshaping, plastic fill & partial respray', 2200.00, 3200.00, 'INR', TRUE),
('Front Bumper', 'Dent', 'Major', 'Bumper restructuring & complete bumper repainting', 4000.00, 5500.00, 'INR', TRUE),
('Front Bumper', 'Scratch', 'Minor', 'Bumper corner buffing & touch-up', 500.00, 900.00, 'INR', TRUE),
('Front Bumper', 'Scratch', 'Moderate', 'Corner refinishing & dual-tone clear coat blend', 1500.00, 2200.00, 'INR', TRUE),
('Front Bumper', 'Scratch', 'Major', 'Full bumper stripping, primer & high-gloss repaint', 3200.00, 4200.00, 'INR', TRUE),
('Front Bumper', 'Crack', 'Minor', 'Plastic welding & seam seal repair', 1200.00, 1800.00, 'INR', TRUE),
('Front Bumper', 'Crack', 'Moderate', 'Reinforced plastic weld, flexible putty & paint blend', 2400.00, 3400.00, 'INR', TRUE),
('Front Bumper', 'Crack', 'Major', 'Structural split repair / Bumper replacement & painting', 5500.00, 8000.00, 'INR', TRUE),

-- Rear Bumper
('Rear Bumper', 'Dent', 'Minor', 'Plastic bumper heat reshaping', 1000.00, 1500.00, 'INR', TRUE),
('Rear Bumper', 'Dent', 'Moderate', 'Heat reshape, sanding & partial repaint', 2200.00, 3200.00, 'INR', TRUE),
('Rear Bumper', 'Dent', 'Major', 'Bumper reconstruction & full repaint', 3800.00, 5200.00, 'INR', TRUE),
('Rear Bumper', 'Scratch', 'Minor', 'Surface buffing & clear gloss treatment', 500.00, 900.00, 'INR', TRUE),
('Rear Bumper', 'Scratch', 'Moderate', 'Deep scratch filling & dual-stage clear blending', 1500.00, 2200.00, 'INR', TRUE),
('Rear Bumper', 'Scratch', 'Major', 'Complete bumper re-spray in paint booth', 3200.00, 4200.00, 'INR', TRUE),
('Rear Bumper', 'Crack', 'Minor', 'Internal plastic stitch & surface touch-up', 1200.00, 1800.00, 'INR', TRUE),
('Rear Bumper', 'Crack', 'Moderate', 'Reinforced thermal welding & spot paint', 2400.00, 3400.00, 'INR', TRUE),
('Rear Bumper', 'Crack', 'Major', 'Bumper assembly replacement & complete paint', 5200.00, 7800.00, 'INR', TRUE),

-- Bonnet / Hood
('Bonnet', 'Dent', 'Minor', 'Precision paintless dent removal', 1500.00, 2200.00, 'INR', TRUE),
('Bonnet', 'Dent', 'Moderate', 'Dent straightening, thermal relief & full bonnet respray', 4000.00, 5500.00, 'INR', TRUE),
('Bonnet', 'Dent', 'Major', 'Crease realignment, heavy bodywork & high-temperature bake', 7000.00, 9500.00, 'INR', TRUE),
('Bonnet', 'Scratch', 'Minor', 'Multi-stage compounding and swirl polish', 800.00, 1200.00, 'INR', TRUE),
('Bonnet', 'Scratch', 'Moderate', 'Scratch leveling & partial clear coat refinish', 2000.00, 3000.00, 'INR', TRUE),
('Bonnet', 'Scratch', 'Major', 'Full hood surface preparation & baked topcoat repaint', 4200.00, 5800.00, 'INR', TRUE),

-- Boot / Tailgate
('Boot', 'Dent', 'Minor', 'PDR treatment on tailgate surface', 1400.00, 2000.00, 'INR', TRUE),
('Boot', 'Dent', 'Moderate', 'Tailgate dent pulling & panel painting', 3600.00, 4800.00, 'INR', TRUE),
('Boot', 'Dent', 'Major', 'Structural decklid repair & multi-coat repaint', 6200.00, 8500.00, 'INR', TRUE),
('Boot', 'Scratch', 'Minor', 'Compound buffing & sealant application', 600.00, 1000.00, 'INR', TRUE),
('Boot', 'Scratch', 'Moderate', 'Scratch sanding, spot color coat & clear blend', 1800.00, 2500.00, 'INR', TRUE),
('Boot', 'Scratch', 'Major', 'Complete tailgate sanding & oven-baked paint finish', 3600.00, 4800.00, 'INR', TRUE),

-- Front Fender (Left / Right)
('Front Fender', 'Dent', 'Minor', 'Fender arch PDR alignment', 1200.00, 1800.00, 'INR', TRUE),
('Front Fender', 'Dent', 'Moderate', 'Fender panel pull & metallic paint spray', 3200.00, 4200.00, 'INR', TRUE),
('Front Fender', 'Dent', 'Major', 'Deep crease reshaping & full fender repainting', 5200.00, 7200.00, 'INR', TRUE),
('Front Fender', 'Scratch', 'Minor', 'Wheel arch scratch buffing', 600.00, 900.00, 'INR', TRUE),
('Front Fender', 'Scratch', 'Moderate', 'Spot primer & blending with adjacent panel', 1600.00, 2400.00, 'INR', TRUE),
('Front Fender', 'Scratch', 'Major', 'Full fender panel repaint', 3200.00, 4200.00, 'INR', TRUE),

-- Rear Quarter Panel
('Rear Quarter Panel', 'Dent', 'Minor', 'PDR technique without panel disassembly', 1600.00, 2400.00, 'INR', TRUE),
('Rear Quarter Panel', 'Dent', 'Moderate', 'Body puller repair & pillar blending repaint', 4200.00, 5800.00, 'INR', TRUE),
('Rear Quarter Panel', 'Dent', 'Major', 'Major unibody quarter repair & full side refinish', 7500.00, 11000.00, 'INR', TRUE),
('Rear Quarter Panel', 'Scratch', 'Minor', 'Surface scratch machine compounding', 700.00, 1100.00, 'INR', TRUE),
('Rear Quarter Panel', 'Scratch', 'Moderate', 'Scratch filling & C-pillar blend painting', 2200.00, 3200.00, 'INR', TRUE),
('Rear Quarter Panel', 'Scratch', 'Major', 'Quarter panel repaint & dual-coat lacquering', 4200.00, 5600.00, 'INR', TRUE),

-- Lighting (Headlamp & Taillamp)
('Headlamp', 'Broken Lamp', 'Minor', 'Lens polishing & minor mounting bracket fix', 800.00, 1400.00, 'INR', TRUE),
('Headlamp', 'Broken Lamp', 'Moderate', 'Headlamp lens replacement or internal clip repair', 2200.00, 3500.00, 'INR', TRUE),
('Headlamp', 'Broken Lamp', 'Major', 'Complete headlamp assembly unit replacement', 4500.00, 8500.00, 'INR', TRUE),
('Headlamp', 'Crack', 'Minor', 'Lens micro-crack UV resin sealing', 900.00, 1500.00, 'INR', TRUE),
('Headlamp', 'Crack', 'Moderate', 'Structural lens sealing & moisture extraction', 1800.00, 2800.00, 'INR', TRUE),
('Headlamp', 'Crack', 'Major', 'Headlamp assembly replacement', 4500.00, 8500.00, 'INR', TRUE),

('Taillamp', 'Broken Lamp', 'Minor', 'Reflector alignment & exterior scratch polish', 600.00, 1000.00, 'INR', TRUE),
('Taillamp', 'Broken Lamp', 'Moderate', 'Sub-housing repair & circuit bulb harness test', 1500.00, 2500.00, 'INR', TRUE),
('Taillamp', 'Broken Lamp', 'Major', 'Complete rear tail-lamp assembly replacement', 3000.00, 5500.00, 'INR', TRUE),
('Taillamp', 'Crack', 'Minor', 'Lens acrylic sealant & waterproofing', 700.00, 1200.00, 'INR', TRUE),
('Taillamp', 'Crack', 'Moderate', 'Lens crack bond & moisture seal', 1400.00, 2200.00, 'INR', TRUE),
('Taillamp', 'Crack', 'Major', 'Tail light assembly replacement', 3000.00, 5500.00, 'INR', TRUE),

-- Glass / Windshield
('Windshield', 'Glass Damage', 'Minor', 'Stone chip / star-break optical resin repair', 1200.00, 1800.00, 'INR', TRUE),
('Windshield', 'Glass Damage', 'Moderate', 'Crack arrest drill & high-pressure polymer injection', 2200.00, 3200.00, 'INR', TRUE),
('Windshield', 'Glass Damage', 'Major', 'Full laminated front windshield glass replacement', 6500.00, 10500.00, 'INR', TRUE),
('Windshield', 'Crack', 'Minor', 'Bullseye crack stabilization with optical resin', 1200.00, 1800.00, 'INR', TRUE),
('Windshield', 'Crack', 'Moderate', 'Long line crack arrest & polymer fill', 2200.00, 3200.00, 'INR', TRUE),
('Windshield', 'Crack', 'Major', 'Complete windshield replacement & sensor calibration', 7000.00, 11000.00, 'INR', TRUE),

-- Wheels & Tires
('Tire', 'Tire Damage', 'Minor', 'Tubeless puncture repair & wheel balancing', 400.00, 700.00, 'INR', TRUE),
('Tire', 'Tire Damage', 'Moderate', 'Sidewall inspection, mushroom plug repair & valve replacement', 1200.00, 1800.00, 'INR', TRUE),
('Tire', 'Tire Damage', 'Major', 'Tire casing replacement (single tire new replacement)', 4000.00, 6500.00, 'INR', TRUE),

-- Roof
('Roof', 'Dent', 'Minor', 'Paintless Dent Removal without headliner drop', 1800.00, 2800.00, 'INR', TRUE),
('Roof', 'Dent', 'Moderate', 'Headliner removal, roof skin straightening & repaint', 5000.00, 7500.00, 'INR', TRUE),
('Roof', 'Dent', 'Major', 'Structural roof rib repair & full vehicle roof repaint', 8500.00, 13000.00, 'INR', TRUE),
('Roof', 'Scratch', 'Minor', 'Roof panel buffing & synthetic wax seal', 800.00, 1300.00, 'INR', TRUE),
('Roof', 'Scratch', 'Moderate', 'Scratch treatment & top-coat clear blend', 2500.00, 3600.00, 'INR', TRUE),
('Roof', 'Scratch', 'Major', 'Full roof surface stripping, basecoat & 2K clear coat', 5000.00, 7000.00, 'INR', TRUE);
