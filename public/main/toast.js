function importProcessFromText(text) {
  const trimmedText = text.trim();
  const lines = trimmedText.split('\n');
  const processData = [];

  lines.forEach((line) => {
    const [stepNumber, stepText] = line.split('. ');

    if (stepNumber && stepText) {
      const title = stepText
        .replace(/^\*\*(.*)\*\*:.*/, '$1') // Remove markdown notation from the title
        .trim();
      const description = stepText
        .replace(/^\*\*.*\*\*:\s*/, '') // Remove markdown notation from the description
        .trim();

      const step = {
        title,
        description
      };
      processData.push(step);
    }
  });

  return processData;
}





const data = `
2. **Run a Business Analysis on the concept**: Establish how the concept will benefit the business's target market. (Small business owners) Further determine how much time, money, and resources the product or feature will take to implement
3. **Concept**: Brainstorm the idea and create a concept on paper in Notion.dd
4. **Product passes business analysis & Timeline setting**: Develop a game plan for how the product will make it into the main StrataMind suite. Determine timeline, and set goals
5. **Product Beta Testing**: When the product enters MVP stage, use the Product Testing flow process until the product has been approved.

`;

const processedData = importProcessFromText(data);
console.log('Processed Data:', processedData);
