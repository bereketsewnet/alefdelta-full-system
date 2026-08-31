UPDATE profit_distribution_buckets
SET bucket_code = 'ENVIRONMENTAL_DEVELOPMENT',
    name = 'Environmental Development and Protection Fund (የአካባቢ ልማትና ጥበቃ)'
WHERE bucket_code = 'STATUTORY_ALLOCATION_1'
  AND name = 'Statutory Allocation 1';

UPDATE profit_distribution_buckets
SET bucket_code = 'EMPLOYEE_INCENTIVE',
    name = 'Employee Incentive Fund (የሠራተኞች ማበረታቻ)'
WHERE bucket_code = 'STATUTORY_ALLOCATION_2'
  AND name = 'Statutory Allocation 2';

UPDATE profit_distribution_buckets
SET bucket_code = 'BOARD_COMMITTEE_INCENTIVE',
    name = 'Board and Committee Incentive Fund (የቦርድና ኮሚቴ ማበረታቻ)'
WHERE bucket_code = 'STATUTORY_ALLOCATION_3'
  AND name = 'Statutory Allocation 3';

UPDATE profit_distribution_buckets
SET bucket_code = 'LOAN_LOSS_RESERVE',
    name = 'Loan Loss Reserve (የማይመለስ ብድር መጠባበቂያ)'
WHERE bucket_code = 'STATUTORY_ALLOCATION_4'
  AND name = 'Statutory Allocation 4';
