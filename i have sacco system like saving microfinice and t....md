This document is **Annex 1** of a SACCO (Savings and Credit Cooperative Organization) loan policy. It defines ten distinct loan tiers based on the member's savings duration, the required pre-savings percentage, share purchases, loan ceilings, repayment periods, and interest rates.

## **1\. English Translation Table**

| Tier / Loan Type | Savings Period Required | Member Obligations / Prerequisites | Loan Ceiling (ETB / Birr) | Max Repayment Period | Interest Rate |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **1\. Standard Loan (Tier 1\)** | 3 Months | • 10% Pre-savings • 10% Share Purchase | Up to 100,000.00 | 24 Months | **14%** |
| **2\. Standard Loan (Tier 2\)** | 4 Months | • 10% Pre-savings • 10% Share Purchase | 100,001.00 – 200,000.00 | 48 Months | **15.5%** |
| **3\. Standard Loan (Tier 3\)** | 5 Months | • 10% Pre-savings • 10% Share Purchase | 200,001.00 – 400,000.00 | 48 Months | **15.5%** |
| **4\. Standard Loan (Tier 4\)** | 6 Months | • 20% Pre-savings • 10% Share Purchase | 400,001.00 – 1,000,000.00 | 48 Months | **15.5%** |
| **5\. Standard Loan (Tier 5\)** | 7 Months | • 20% Pre-savings • 10% Share Purchase | 1,000,001.00 – 1,500,000.00 | 60 Months | **16.5%** |
| **6\. Standard Loan (Tier 6\)** | 8 Months | • 30% Pre-savings • 10% Share Purchase | 1,500,001.00 – 2,500,000.00 | 60 Months | **16.5%** |
| **7\. Standard Loan (Tier 7\)** | 9 Months | • 30% Pre-savings • 10% Share Purchase | 2,500,001.00 – 3,500,000.00 | 60 Months | **16.5%** |
| **8\. Standard Loan (Tier 8\)** | 10 Months | • 35% Pre-savings • 15% Share Purchase | 3,500,001.00 – 7,000,000.00 | 96 Months | **17%** |
| **9\. Vehicle Purchase Loan** | 3 Months | • 50% Pre-savings (Lump-sum upfront) • 10% Share Purchase | Up to 3,500,000.00 | 60 Months | **16.5%** |
| **10\. House Purchase Loan** | 4 Months | • 45% Pre-savings (Lump-sum upfront) • 15% Share Purchase | Up to 7,000,000.00 | 96 Months | **17%** |

## **2\. Summary of Loan Types**

Your SACCO system offers **three main categories** of loans divided into 10 rules:

### **A. Regular / Standard Loans (Tiers 1 to 8\)**

These are general-purpose loans where the borrowing limit scales up based on how long the member has been saving and how much they have saved.

* **Small Loans (Up to 400,000 ETB):** Requires only 3–5 months of savings history, a **10% pre-savings deposit**, and a **10% share purchase**. Interest rates range from 14% to 15.5%.  
* **Medium Loans (400,001 to 1,500,000 ETB):** Requires 6–7 months of savings history, a **20% pre-savings deposit**, and a **10% share purchase**. Interest rates range from 15.5% to 16.5%.  
* **Large Loans (1,500,001 to 3,500,000 ETB):** Requires 8–9 months of savings history, a **30% pre-savings deposit**, and a **10% share purchase**. Interest rate is 16.5%.  
* **Maximum Standard Loan (3,500,001 to 7,000,000 ETB):** Requires 10 months of savings history, a **35% pre-savings deposit**, and a **15% share purchase**. Repayable over 8 years (96 months) at a 17% interest rate.

### **B. Vehicle Purchase Loan (Tier 9\)**

* **Purpose:** For members buying an automobile.  
* **Special Condition:** Designed for members who deposit their pre-savings all at once as a lump sum.  
* **Terms:** Requires a **3-month** waiting/savings period, a massive **50% pre-savings** commitment, and a **10% share purchase**. The ceiling is **3,500,000 ETB** over **60 months** at **16.5%** interest.

### **C. House Purchase Loan (Tier 10\)**

* **Purpose:** For members buying residential property or constructing a home.  
* **Special Condition:** Designed for members who deposit their pre-savings all at once as a lump sum.  
* **Terms:** Requires a **4-month** waiting/savings period, a **45% pre-savings** commitment, and a **15% share purchase**. The ceiling is **7,000,000 ETB** over **96 months** (8 years) at **17%** interest.

## **3\. Developer / Code Agent Documentation**

To help your coding agent (AI assistant, backend developer, or rule engine) easily implement this in your software, copy and paste the following structured **JSON Schema / Configuration Rules**. It maps the entire business logic cleanly into data formats that code can read.

JSON  
\[  
  {  
    "tier\_id": 1,  
    "product\_name": "Standard Loan \- Tier 1",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 3,  
    "loan\_amount\_min\_etb": 0.00,  
    "loan\_amount\_max\_etb": 100000.00,  
    "required\_pre\_savings\_pct": 10.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 24,  
    "interest\_rate\_pct": 14.0,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 2,  
    "product\_name": "Standard Loan \- Tier 2",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 4,  
    "loan\_amount\_min\_etb": 100001.00,  
    "loan\_amount\_max\_etb": 200000.00,  
    "required\_pre\_savings\_pct": 10.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 48,  
    "interest\_rate\_pct": 15.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 3,  
    "product\_name": "Standard Loan \- Tier 3",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 5,  
    "loan\_amount\_min\_etb": 200001.00,  
    "loan\_amount\_max\_etb": 400000.00,  
    "required\_pre\_savings\_pct": 10.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 48,  
    "interest\_rate\_pct": 15.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 4,  
    "product\_name": "Standard Loan \- Tier 4",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 6,  
    "loan\_amount\_min\_etb": 400001.00,  
    "loan\_amount\_max\_etb": 1000000.00,  
    "required\_pre\_savings\_pct": 20.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 48,  
    "interest\_rate\_pct": 15.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 5,  
    "product\_name": "Standard Loan \- Tier 5",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 7,  
    "loan\_amount\_min\_etb": 1000001.00,  
    "loan\_amount\_max\_etb": 1500000.00,  
    "required\_pre\_savings\_pct": 20.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 60,  
    "interest\_rate\_pct": 16.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 6,  
    "product\_name": "Standard Loan \- Tier 6",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 8,  
    "loan\_amount\_min\_etb": 1500001.00,  
    "loan\_amount\_max\_etb": 2500000.00,  
    "required\_pre\_savings\_pct": 30.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 60,  
    "interest\_rate\_pct": 16.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 7,  
    "product\_name": "Standard Loan \- Tier 7",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 9,  
    "loan\_amount\_min\_etb": 2500001.00,  
    "loan\_amount\_max\_etb": 3500000.00,  
    "required\_pre\_savings\_pct": 30.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 60,  
    "interest\_rate\_pct": 16.5,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 8,  
    "product\_name": "Standard Loan \- Tier 8",  
    "loan\_category": "STANDARD",  
    "min\_savings\_duration\_months": 10,  
    "loan\_amount\_min\_etb": 3500001.00,  
    "loan\_amount\_max\_etb": 7000000.00,  
    "required\_pre\_savings\_pct": 35.0,  
    "required\_share\_purchase\_pct": 15.0,  
    "max\_repayment\_period\_months": 96,  
    "interest\_rate\_pct": 17.0,  
    "requires\_lump\_sum\_pre\_savings": false  
  },  
  {  
    "tier\_id": 9,  
    "product\_name": "Vehicle Purchase Loan",  
    "loan\_category": "VEHICLE",  
    "min\_savings\_duration\_months": 3,  
    "loan\_amount\_min\_etb": 0.00,  
    "loan\_amount\_max\_etb": 3500000.00,  
    "required\_pre\_savings\_pct": 50.0,  
    "required\_share\_purchase\_pct": 10.0,  
    "max\_repayment\_period\_months": 60,  
    "interest\_rate\_pct": 16.5,  
    "requires\_lump\_sum\_pre\_savings": true  
  },  
  {  
    "tier\_id": 10,  
    "product\_name": "House Purchase Loan",  
    "loan\_category": "HOUSING",  
    "min\_savings\_duration\_months": 4,  
    "loan\_amount\_min\_etb": 0.00,  
    "loan\_amount\_max\_etb": 7000000.00,  
    "required\_pre\_savings\_pct": 45.0,  
    "required\_share\_purchase\_pct": 15.0,  
    "max\_repayment\_period\_months": 96,  
    "interest\_rate\_pct": 17.0,  
    "requires\_lump\_sum\_pre\_savings": true  
  }  
\]

### **Prompt to Feed Your Code Agent:**

You can copy this exact text and feed it to your development AI or programmer:  
*"Implement a loan eligibility and calculation service using the attached JSON configuration. When a SACCO member requests a loan, the system must validate: (1) if their account age meets min\_savings\_duration\_months, (2) if the requested amount falls between loan\_amount\_min\_etb and loan\_amount\_max\_etb, and (3) verify that their savings account balance is at least equal to required\_pre\_savings\_pct of the requested amount, while ensuring they purchase shares equivalent to required\_share\_purchase\_pct."*