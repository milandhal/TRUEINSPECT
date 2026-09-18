/**
 * Evaluates visual condition based on defect counts and severities.
 * As defined in Requirement 30:
 * - No visible defects -> Good
 * - Only minor defects -> Good / Minor Repairs
 * - Minor + Moderate defects -> Fair
 * - One or more Major defects -> Needs Major Repair (single Major defect)
 * - Multiple Major defects -> Extensive Repair Required (>1 Major defects)
 * 
 * Label: TRUEINSPECT Visual Condition Assessment
 */
function assessVisualCondition(defects = []) {
  if (!defects || defects.length === 0) {
    return {
      grade: 'Good',
      description: 'No visible exterior defects detected on inspected panels.',
      severityCounts: { minor: 0, moderate: 0, major: 0 }
    };
  }

  let minorCount = 0;
  let moderateCount = 0;
  let majorCount = 0;

  for (const defect of defects) {
    const s = (defect.severity || '').toLowerCase();
    if (s === 'major') majorCount++;
    else if (s === 'moderate') moderateCount++;
    else if (s === 'minor') minorCount++;
  }

  const severityCounts = { minor: minorCount, moderate: moderateCount, major: majorCount };

  if (majorCount > 1) {
    return {
      grade: 'Extensive Repair Required',
      description: 'Multiple major exterior defects identified requiring comprehensive panel or structural refurbishment.',
      severityCounts
    };
  }

  if (majorCount === 1) {
    return {
      grade: 'Needs Major Repair',
      description: 'One major exterior defect identified requiring significant refurbishment.',
      severityCounts
    };
  }

  if (moderateCount > 0) {
    return {
      grade: 'Fair',
      description: 'Moderate exterior defects identified requiring cosmetic refurbishment and panel touch-up.',
      severityCounts
    };
  }

  if (minorCount > 0) {
    return {
      grade: 'Good / Minor Repairs',
      description: 'Only minor cosmetic scratches or shallow dents identified; vehicle in overall good condition.',
      severityCounts
    };
  }

  return {
    grade: 'Good',
    description: 'No visible exterior defects detected.',
    severityCounts
  };
}

module.exports = {
  assessVisualCondition
};
