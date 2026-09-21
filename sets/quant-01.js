// GMAT Focus-style Quantitative Reasoning set — 21 Problem Solving questions, 45 minutes.
// Original questions written for practice; format mirrors the official section structure
// (Problem Solving only, no Data Sufficiency in the Focus quant section).
window.registerSet({
  id: "quant-01",
  title: "Quant Section 1 — Mixed Fundamentals",
  section: "Quantitative Reasoning",
  minutes: 45,
  note: "Problem Solving only, mirroring the GMAT Focus quant section: 21 questions in 45 minutes (about 2:09 per question).",
  questions: [
  {
    id: 1, topic: "Percents", diff: "Easy", target: 100,
    stem: "A shirt is priced at $80. The price is first reduced by 15%, and the reduced price is then reduced by an additional 10%. What is the final price of the shirt?",
    choices: ["$59.00", "$60.00", "$61.20", "$62.00", "$68.00"], answer: 2,
    why: "80 × 0.85 = 68; 68 × 0.90 = 61.20. Successive discounts multiply — they never add to 25%. The trap answer $60.00 comes from subtracting 25% directly."
  },
  {
    id: 2, topic: "Number Properties", diff: "Easy", target: 100,
    stem: "If n is a positive integer and n² is divisible by 12, what is the smallest possible value of n?",
    choices: ["2", "3", "4", "6", "12"], answer: 3,
    why: "12 = 2² × 3. For n² to contain 3, n itself must contain 3; for n² to contain 2², n must contain 2. So n must be a multiple of 6, and 6² = 36 is divisible by 12."
  },
  {
    id: 3, topic: "Algebra", diff: "Easy", target: 95,
    stem: "If 2x − 3y = 12 and x = 2y, what is the value of x?",
    choices: ["6", "12", "18", "24", "36"], answer: 3,
    why: "Substitute: 2(2y) − 3y = 12 → y = 12. Then x = 2y = 24. Answer choice 12 is the value of y, the classic 'solved for the wrong variable' trap."
  },
  {
    id: 4, topic: "Rates & Work", diff: "Medium", target: 125,
    stem: "Machine A can complete a job alone in 6 hours and Machine B can complete the same job alone in 12 hours. Working simultaneously at their constant rates, how many hours do they need to complete the job?",
    choices: ["3", "4", "4.5", "6", "9"], answer: 1,
    why: "Add rates: 1/6 + 1/12 = 3/12 = 1/4 job per hour, so the job takes 4 hours. Averaging the times (9 hours) is always wrong for combined-work problems."
  },
  {
    id: 5, topic: "Ratios", diff: "Medium", target: 120,
    stem: "In a class, the ratio of boys to girls is 5 to 7. If there are 36 more girls than boys, how many students are in the class?",
    choices: ["144", "180", "196", "216", "252"], answer: 3,
    why: "Let the parts be 5k and 7k. The difference 2k = 36, so k = 18. Total = 12k = 216."
  },
  {
    id: 6, topic: "Statistics", diff: "Medium", target: 120,
    stem: "The five numbers 4, 7, 9, 12, and x have an average (arithmetic mean) of 9. What is the median of the five numbers?",
    choices: ["7", "9", "10", "12", "13"], answer: 1,
    why: "Sum must be 45, so x = 45 − 32 = 13. Ordered: 4, 7, 9, 12, 13 — the median is 9. Choice 13 is the value of x, not the median."
  },
  {
    id: 7, topic: "Percents", diff: "Medium", target: 125,
    stem: "A company's revenue increased by 20% in Year 1 and then decreased by 25% in Year 2. Compared with its revenue before Year 1, the revenue after Year 2 was",
    choices: ["5% lower", "10% lower", "10% higher", "15% lower", "unchanged"], answer: 1,
    why: "1.20 × 0.75 = 0.90, a 10% decrease. Percent changes compound on a shifting base, so +20% and −25% do not net to −5%."
  },
  {
    id: 8, topic: "Exponents", diff: "Hard", target: 150,
    stem: "If 2ˣ + 2ˣ⁺² = 80, what is the value of x?",
    choices: ["2", "3", "4", "5", "6"], answer: 2,
    why: "Factor the smaller power: 2ˣ(1 + 2²) = 2ˣ × 5 = 80, so 2ˣ = 16 and x = 4. Factoring, not expanding, is the move on every exponent-sum question."
  },
  {
    id: 9, topic: "Number Properties", diff: "Hard", target: 140,
    stem: "When the positive integer n is divided by 7, the remainder is 4. What is the remainder when 3n + 5 is divided by 7?",
    choices: ["0", "1", "3", "4", "5"], answer: 2,
    why: "Pick n = 11: 3(11) + 5 = 38, and 38 = 7(5) + 3, so the remainder is 3. Algebraically, 3(7k+4) + 5 = 21k + 17 = 21k + 14 + 3."
  },
  {
    id: 10, topic: "Inequalities", diff: "Medium", target: 130,
    stem: "If x and y are integers with −3 < x < 5 and 2 < y < 6, what is the greatest possible value of x − y?",
    choices: ["−1", "0", "1", "2", "3"], answer: 2,
    why: "Strict inequalities and integers give x ≤ 4 and y ≥ 3, so the maximum of x − y is 4 − 3 = 1. Using the endpoints 5 and 2 gives the trap answer 3."
  },
  {
    id: 11, topic: "Mixtures", diff: "Hard", target: 150,
    stem: "A chemist has 10 liters of a solution that is 30% acid by volume. How many liters of pure acid must be added to make a solution that is 50% acid by volume?",
    choices: ["2", "3", "4", "5", "6"], answer: 2,
    why: "Acid: 3 + a = 0.5(10 + a) → 3 + a = 5 + 0.5a → 0.5a = 2 → a = 4 liters. Track the solute amount, not the percentage."
  },
  {
    id: 12, topic: "Rates & Work", diff: "Medium", target: 130,
    stem: "A car travels 60 miles at an average speed of 30 miles per hour and then travels another 60 miles at an average speed of 60 miles per hour. What is the car's average speed for the entire 120-mile trip?",
    choices: ["36 mph", "40 mph", "42 mph", "45 mph", "48 mph"], answer: 1,
    why: "Times are 2 hours and 1 hour, so average speed = 120/3 = 40 mph. Averaging the two speeds gives 45 mph, which is the designed trap."
  },
  {
    id: 13, topic: "Combinatorics", diff: "Hard", target: 150,
    stem: "A committee of 3 people is to be selected from a group of 5 men and 4 women. How many different committees contain exactly 1 woman?",
    choices: ["20", "30", "40", "60", "84"], answer: 2,
    why: "Choose 1 woman from 4 (4 ways) and 2 men from 5 (10 ways): 4 × 10 = 40."
  },
  {
    id: 14, topic: "Probability", diff: "Hard", target: 155,
    stem: "Two fair six-sided dice are rolled. What is the probability that the sum of the two numbers showing is a prime number?",
    choices: ["1/3", "5/12", "1/2", "7/12", "2/3"], answer: 1,
    why: "Prime sums are 2, 3, 5, 7, 11 with 1 + 2 + 4 + 6 + 2 = 15 outcomes out of 36, which reduces to 5/12. Note that 9 is not prime."
  },
  {
    id: 15, topic: "Algebra", diff: "Hard", target: 140,
    stem: "If x² − 7x + 12 = 0, what is the value of x² − 7x + 20?",
    choices: ["0", "8", "12", "20", "32"], answer: 1,
    why: "The equation gives x² − 7x = −12, so x² − 7x + 20 = −12 + 20 = 8. No need to find the roots at all — recognize the repeated expression."
  },
  {
    id: 16, topic: "Sequences", diff: "Hard", target: 140,
    stem: "In a sequence, a₁ = 3 and aₙ₊₁ = 2aₙ − 1 for every positive integer n. What is the value of a₅?",
    choices: ["17", "23", "31", "33", "65"], answer: 3,
    why: "3 → 5 → 9 → 17 → 33. Write out the terms; five terms is faster than hunting for a closed form."
  },
  {
    id: 17, topic: "Sets", diff: "Medium", target: 125,
    stem: "At a school, 40% of the students study Spanish, 25% study French, and 10% study both languages. What percent of the students study neither language?",
    choices: ["25%", "35%", "40%", "45%", "55%"], answer: 3,
    why: "Either language = 40 + 25 − 10 = 55%, so neither = 45%. Forgetting to subtract the overlap yields the trap answer 35%."
  },
  {
    id: 18, topic: "Rates & Work", diff: "Hard", target: 145,
    stem: "An inlet pipe can fill an empty tank in 20 minutes, and a drain can empty the full tank in 30 minutes. If both are open and the tank starts empty, how many minutes will it take to fill the tank?",
    choices: ["12", "25", "50", "60", "70"], answer: 3,
    why: "Net rate = 1/20 − 1/30 = 1/60 tank per minute, so 60 minutes. Subtract opposing rates instead of adding them."
  },
  {
    id: 19, topic: "Number Properties", diff: "Medium", target: 125,
    stem: "How many integers between 100 and 200, inclusive, are divisible by both 4 and 6?",
    choices: ["6", "7", "8", "9", "16"], answer: 2,
    why: "Divisible by both means divisible by LCM 12: 108 through 192, so (192 − 108)/12 + 1 = 8."
  },
  {
    id: 20, topic: "Word Problems", diff: "Medium", target: 130,
    stem: "The sum of three consecutive odd integers is 3 more than twice the largest of the three. What is the largest of the three integers?",
    choices: ["5", "7", "9", "11", "13"], answer: 2,
    why: "With smallest n: 3n + 6 = 2(n + 4) + 3 → n = 5, giving 5, 7, 9. The largest is 9; choice 5 is the smallest."
  },
  {
    id: 21, topic: "Interest & Growth", diff: "Hard", target: 145,
    stem: "An amount of $8,000 is invested at an annual interest rate of 10%, compounded annually. What is the total interest earned after 2 years?",
    choices: ["$1,600", "$1,680", "$1,700", "$1,760", "$9,680"], answer: 1,
    why: "8000(1.1)² = 9,680, so interest = 1,680. Simple interest would give 1,600, and 9,680 is the balance rather than the interest."
  }
  ]
});
