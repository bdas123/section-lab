/* GMAT Focus Edition section-score percentile rankings.
   Percentile = share of test takers who scored below that section score.

   Quantitative and Verbal Reasoning: GMAC Score Concordance Tables, published Aug 2026,
   data period July 1, 2021 – June 30, 2026 (values to the nearest tenth).
     https://go.gmac.com/hubfs/07.Assessments/GMAT%20Exam/GMAT_Quant_Concordance_Aug2026.pdf
     https://go.gmac.com/hubfs/07.Assessments/GMAT%20Exam/GMAT_Verbal_Concordance_Aug2026.pdf
   Data Insights: GMAC's Aug 12, 2026 percentile update as tabulated by GMAT Club
   (whole percents; GMAC does not publish a DI concordance PDF because the old exam had no DI section).
     https://gmatclub.com/forum/gmat-percentiles-updated-aug-2026-full-analysis-461144.html

   GMAC refreshes these every year in Q3. To update, replace the numbers below. */
window.GMAT_PERCENTILES = {
  quant: {
    label: "Quantitative Reasoning",
    source: "GMAC concordance table, Aug 2026 (exams Jul 2021 – Jun 2026)",
    url: "https://go.gmac.com/hubfs/07.Assessments/GMAT%20Exam/GMAT_Quant_Concordance_Aug2026.pdf",
    decimals: 1,
    table: { 60: 1.0, 61: 1.4, 62: 1.8, 63: 2.4, 64: 3.1, 65: 4.1, 66: 5.4, 67: 7.2, 68: 9.1, 69: 11.4, 70: 13.8, 71: 16.6, 72: 19.9, 73: 23.4, 74: 27.6, 75: 32.6, 76: 37.7, 77: 43.4, 78: 50.2, 79: 57.3, 80: 63.9, 81: 69.8, 82: 75.3, 83: 80.1, 84: 84.6, 85: 87.8, 86: 90.9, 87: 93.4, 88: 95.4, 89: 96.6, 90: 100.0 }
  },
  verbal: {
    label: "Verbal Reasoning",
    source: "GMAC concordance table, Aug 2026 (exams Jul 2021 – Jun 2026)",
    url: "https://go.gmac.com/hubfs/07.Assessments/GMAT%20Exam/GMAT_Verbal_Concordance_Aug2026.pdf",
    decimals: 1,
    table: { 60: 0.7, 61: 0.8, 62: 0.9, 63: 1.1, 64: 1.3, 65: 1.5, 66: 1.8, 67: 2.2, 68: 2.8, 69: 3.4, 70: 4.3, 71: 5.8, 72: 7.8, 73: 10.5, 74: 14.0, 75: 18.2, 76: 23.0, 77: 29.9, 78: 37.7, 79: 46.0, 80: 54.4, 81: 64.3, 82: 72.9, 83: 81.1, 84: 87.3, 85: 92.6, 86: 95.7, 87: 97.4, 88: 98.4, 89: 99.0, 90: 100.0 }
  },
  di: {
    label: "Data Insights",
    source: "GMAC percentile update, Aug 2026, via GMAT Club (whole percents)",
    url: "https://gmatclub.com/forum/gmat-percentiles-updated-aug-2026-full-analysis-461144.html",
    decimals: 0,
    table: { 60: 3, 61: 4, 62: 5, 63: 5, 64: 7, 65: 8, 66: 10, 67: 11, 68: 14, 69: 17, 70: 20, 71: 24, 72: 29, 73: 34, 74: 40, 75: 46, 76: 52, 77: 61, 78: 69, 79: 76, 80: 83, 81: 88, 82: 93, 83: 95, 84: 97, 85: 98, 86: 99, 87: 99, 88: 99, 89: 100, 90: 100 }
  }
};
