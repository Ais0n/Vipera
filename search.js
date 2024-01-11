// script.js

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded event fired");

    document.getElementById("myForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent the default form submission

        console.log("Submit button clicked");
        
        // Get the user's input from the search input
        var userInput = document.getElementById("searchInput").value;

        if (userInput.trim() === "") {
            console.log("User input is empty. API call not made.");
            return;
        }
        
        console.log("User Input:", userInput);

        // Define the data structure for the API request
        var requestData = {
            promptStr: userInput
        };
        
        // Make a POST request to your API
        fetch("http://ec2-18-191-212-44.us-east-2.compute.amazonaws.com:5001/ouroboros", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData) // Send the request data as JSON
        })
        .then(response => response.json())
        .then(data => {
            // Handle the API response data here
            console.log("API Response:", data);
            document.getElementById("result").innerText = "API Result: " + JSON.stringify(data);
        })
        .catch(error => {
            console.error("API Error:", error);
            document.getElementById("result").innerText = "Error: " + error.message;
        });
    });
});
