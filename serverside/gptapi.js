fetch('https://api.openai.com/v1/engines/davinci/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer *insert api key here*`
  },
  body: JSON.stringify({
    prompt: 'Write a sad poem about my border collie, Pepper',
    max_tokens: 100
  })
})
.then(response => response.json())
.then(data => {
  console.log(data);
});