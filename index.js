const express = require('express');
const app = express();
const port = 8008;
const TIMEOUT_MS = 500; 


app.get('/numbers', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter (url) is required.' });
  }

  try {

    const urls = Array.isArray(url) ? url : [url];
    const uniqueNumbersSet = new Set();


    const fetchPromises = urls.map((url) => fetchDataFromURL(url));

    // Wait for all promises to resolve or timeout
    const results = await Promise.allSettled(
      fetchPromises.map((promise) => Promise.race([promise, timeoutPromise(TIMEOUT_MS)]))
    );

    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data && data.numbers && Array.isArray(data.numbers)) {
          data.numbers.forEach((number) => uniqueNumbersSet.add(number));
        }
      } else {
        console.error('Error occurred while fetching data:', result.reason.message);
      }
    });

    const mergedNumbers = Array.from(uniqueNumbersSet).sort((a, b) => a - b);
    res.json({ numbers: mergedNumbers });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});


async function fetchDataFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from URL: ${url}`, error.message);
    return null;
  }
}


function timeoutPromise(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
