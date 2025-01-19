import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PyPDF2 import PdfReader
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Flask App Setup
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)  # This will allow cross-origin requests from any domain

# Configure the GenAI API
genai.configure(api_key="AIzaSyBZM6dTMcLhZ-nY7Uetow2JbxTsAP4lqxg")

# Function to download PDF from a URL
def download_pdf(pdf_url):
    response = requests.get(pdf_url)
    if response.status_code == 200:
        filename = pdf_url.split("/")[-1]  # Extract filename from URL
        with open(filename, "wb") as f:
            f.write(response.content)
        return filename
    else:
        raise Exception(f"Failed to download PDF. Status code: {response.status_code}")

# Route to handle file processing and querying
@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        # Get the JSON data from the request
        data = request.get_json()

        # Extract file path (could be URL or local path) and query from the request
        pdf_path = data.get('file_path')
        user_query = data.get('query')

        if not pdf_path or not user_query:
            return jsonify({"error": "Both 'file_path' and 'query' are required."}), 400

        # Check if the file path is a URL or local file path
        if pdf_path.startswith("http://") or pdf_path.startswith("https://"):
            # If the path is a URL, download the PDF
            pdf_path = download_pdf(pdf_path)
        
        # Read the PDF file
        pdf_reader = PdfReader(pdf_path)
        raw_text = 'filename-' + pdf_path + '\\n'
        
        for page in pdf_reader.pages:
            content = page.extract_text()
            if content:
                raw_text += content.replace('\n', '\\n') + '\\n'

        # Configure the generation settings
        generation_config = {
            "temperature": 2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }

        # Create the model
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=generation_config,
        )

        # Add extracted text and query to chat history
        chat_history = [
            {"role": "user", "parts": [raw_text]},
            {"role": "user", "parts": [user_query]}
        ]

        # Start the chat session
        chat_session = model.start_chat(history=chat_history)

        # Get the response from the chat model
        response = chat_session.send_message(user_query)

        # Return the response
        return jsonify({"answer": response.text})

    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False)
