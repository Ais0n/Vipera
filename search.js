let isGenerating = false; 
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
        // Setting isGenerating logic
        if (isGenerating){
            console.log("Generation in progress. API call not made.");
            return;
        }
        // Define the data structure for the API request
        var requestData = {
            promptStr: userInput
        };
        
        
        isGenerating = true;
        console.log("isGenerating set to true on", userInput);
        // Make a POST request to your API
        fetch("http://ec2-18-220-129-40.us-east-2.compute.amazonaws.com:5001/ouroboros", {
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
            isGenerating = false;
            console.log("isGenerating set to false on", userInput);
        })
        .catch(error => {
            console.error("API Error:", error);
            document.getElementById("result").innerText = "Error: " + error.message;
            isGenerating = false;
            console.log("isGenerating set to false on", userInput);
        });
        


    });
});
