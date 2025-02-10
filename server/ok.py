from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Flask App Setup
app = Flask(__name__)
CORS(app)

# Storage for the most recently stored texts
texts_storage = []

# Configure the GenAI API
genai.configure(api_key="AIzaSyBZM6dTMcLhZ-nY7Uetow2JbxTsAP4lqxg")

# System Instructions
SYSTEM_INSTRUCTION = """
You are Peep, an AI assistant developed by team Bludgers for document-based queries. Follow these strict guidelines:

1. **Always answer from the provided document context** and append relevant sources at the end in this format:
   `/ltkgya-sources <filename>.pdf /Ids <fileId>`  
   Do not include `filename-uploads/` in sources.
   
2. **Mix text and tables** in responses. Tables must be enclosed between `table-starts` and `table-ends`.  
   **Do NOT include `|---|` in tables.**  
   Example:  table-starts Column1 | Column2 Value1 | Value2 table-ends
   
3. Maintain **consistency** across queries. If a new query lacks context, infer it from previous conversations.

4. **Language Adaptation**: Respond in the language the user queries in.

5. **Avoid Unnecessary Randomness**: Use a structured, deterministic response style.

6. **For time-related queries**, provide real-time values in the user's timezone.

7. **For weather queries**, mention the latest weather conditions in the user's preferred location.

8. **General replies should be polite and well-structured.** When asked 'Who are you?', respond:  
"You are Peep. An assistant developed by team Bludgers for queries of PDFs."

9. **While sending links**, ensure they are clickable and properly formatted.
"""

# Route to store texts
@app.route('/store-texts', methods=['POST'])
def store_texts():
 global texts_storage
 try:
     data = request.get_json()
     texts = data.get('texts', [])

     if not texts:
         return jsonify({"error": "'texts' field is required."}), 400

     texts_storage = texts
     return jsonify({"message": "Texts stored successfully."})

 except Exception as e:
     logging.error(f"Error storing texts: {e}")
     return jsonify({"error": str(e)}), 500


# Route to query the texts
@app.route('/pdf-query', methods=['POST'])
def pdf_query():
 try:
     data = request.get_json()
     user_query = data.get('query')

     if not texts_storage:
         return jsonify({"error": "No texts stored. Please use /store-texts to store texts first."}), 400

     if not user_query:
         return jsonify({"error": "'query' field is required."}), 400

     # Configure the generation settings
     generation_config = {
         "temperature": 1.3,  # Reduced randomness
         "top_p": 0.95,
         "top_k": 40,
         "max_output_tokens": 8192,
         "response_mime_type": "text/plain",
     }

     # Create the model
     model = genai.GenerativeModel(
         model_name="gemini-2.0-flash-thinking-exp-01-21",
         generation_config=generation_config,
         system_instruction=SYSTEM_INSTRUCTION
     )

     # Prepare the chat history
     chat_history = [
         {"role": "user", "parts": texts_storage},
         {"role": "user", "parts": [user_query]},
     ]

     # Start the chat session
     chat_session = model.start_chat(history=chat_history)

     # Get the response from the chat model
     response = chat_session.send_message(user_query)

     # Append sources at the end
     sources_text = f"/ltkgya-sources {','.join([t.split('.')[0] + '.pdf' for t in texts_storage if t.endswith('.pdf')])} /Ids {','.join([t.split('.')[0] for t in texts_storage if t.endswith('.pdf')])}"
     final_response = f"{response.text}\n\n{sources_text}" if texts_storage else response.text

     return jsonify({"answer": final_response})

 except Exception as e:
     logging.error(f"Error querying text: {e}")
     return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
 app.run(host='0.0.0.0', port=6000, debug=False)

