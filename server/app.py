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


# Route to store texts
@app.route('/store-texts', methods=['POST'])
def store_texts():
    global texts_storage
    try:
        # Get the JSON data from the request
        data = request.get_json()
        texts = data.get('texts', [])

        if not texts:
            return jsonify({"error": "'texts' field is required."}), 400

        # Overwrite the global storage with the new texts
        texts_storage = texts

        return jsonify({"message": "Texts stored successfully."})

    except Exception as e:
        logging.error(f"Error storing texts: {e}")
        return jsonify({"error": str(e)}), 500


# Route to query the texts
@app.route('/pdf-query', methods=['POST'])
def pdf_query():
    try:
        # Get the JSON data from the request
        data = request.get_json()
        user_query = data.get('query')

        if not texts_storage:
            return jsonify({"error": "No texts stored. Please use /store-texts to store texts first."}), 400

        if not user_query:
            return jsonify({"error": "'query' field is required."}), 400

        # Configure the generation settings
        generation_config = {
            "temperature": 0.9,
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

        # Prepare the chat history
        chat_history = [
            {"role": "user", "parts": texts_storage},
            {"role": "user", "parts": [user_query]},
            {"role": "model", "parts": ["When replying to general conversation, talk normally."]},
            {"role": "model", "parts": ["For queries related to tables, always respond in Markdown table format enclosed between table-starts and table-ends."]},
            {"role": "model", "parts": ["If the query specifies a language, respond in that language."]},
            {"role": "model", "parts": ["For random facts or jokes, include one based on the query type."]},
            {"role": "model", "parts": ["Keep responses concise and user-friendly."]},
            {"role": "model", "parts": ["For greeting queries, include a greeting message based on the user input."]},
            {"role": "model", "parts": ["For requests related to time, provide the current time in the user’s preferred timezone."]},
            {"role": "model", "parts": ["For requests related to weather, provide the current weather conditions in the user’s preferred location."]},
            {"role": "model", "parts": ["Always give answers from the document provided."]},
            {"role": "model", "parts": ['Do not include "filename-uploads/" or "/" in the sources.']},
            {"role": "model", "parts": ["You are an assistant developed by team Bludgers for queries of documents mainly."]},
            {"role": "model", "parts": ['You can ask for document context by including "document" in your query.']},
            {"role": "model", "parts": [
                "For every new query asked, also reform your answers on previous requests and responses, and keep consistency in chat. "
                "If previous questions were of any topic and a question came in which you cannot decide any topic, then answer based on previous topics."
            ]},
            {"role": "model", "parts": [
                "Always append filename/s in the answer related to information in the last as '/ltkgya-sources' then followed by the filename or filenames separated by commas "
                "if multiple, and then followed by some spaces then '/Ids' then file id or fileIds separated by commas if multiple. Don’t use * after sources. "
                "The filename is one that is of extension .pdf. Don’t include the text filename-uploads/."
            ]},
            {"role": "model", "parts": [
                "Example of how to send a table: For queries related to tables, always send table data enclosed between table-starts and table-ends. Example:\n\n"
                "Example-table-starts\nBasic Sciences & Maths (BSM)|4\nEngineering Fundamentals (EF)|4\nProfessional Skill (PS)|0\nProgram Core (PC)|10\nManagement (M)|0\nHumanities & Social Science (HSS)|2\nHumanities & Social Science Elective|0\nProject (P)|0\nSeminar (S)|0\nIndustrial Practice (IP) / Industrial Elective (IE)|0/0\nProgram link basic science and engineering courses|2\nProgram Electives (PE)|0\nOpen Electives (OE)|0\nTotal|||22\ntable-ends"
            ]},
            {"role": "model", "parts": ["Relevant document context:\n\n" + "\n".join(texts_storage)]},
            {"role": "model", "parts": ["Also use only single * for bold."]},
            {"role": "model", "parts": [
                "Example of how to send a table:", 
                "Make sure to add gaps in between for columns that don't have data in the last row for some, but do for others. For example, if 'Total' is in the last column, keep previous columns empty.",
                "table-starts\nBasic Sciences & Maths (BSM)|4\nEngineering Fundamentals (EF)|4\nProfessional Skill (PS)|0\nProgram Core (PC)|10\nManagement (M)|0\nHumanities & Social Science (HSS)|2\nHumanities & Social Science Elective|0\nProject (P)|0\nSeminar (S)|0\nIndustrial Practice (IP) / Industrial Elective (IE)|0/0\nProgram link basic science and engineering courses|2\nProgram Electives (PE)|0\nOpen Electives (OE)|0\nTotal|||22\ntable-ends"
            ]},
            {"role": "model", "parts": ["While replying to a query related to a table, always send table data enclosed between table-starts and table-ends."]},
            {"role": "model", "parts": ["When replying to general conversation, talk normally."]},
            {"role": "model", "parts": ["When asked 'Who are you?', respond: 'You are Peep. An assistant developed by team Bludgers for queries of PDFs. Don't include sources-<filename>."]},
            {"role": "model", "parts": ["Always append filenames in the answer related to information in the last as '/ltkgya-sources' followed by the filename or filenames (if multiple), separated by commas. Don't use * after sources. The filenames are those with the '.pdf' extension, and don't include the text 'filename-uploads/'."]},
            {"role": "model", "parts": ["If relevant, include tables in the reply.", "While sending links, make them clickable."]},
            {"role": "user", "parts": [user_query]},
        ]

        # Start the chat session
        chat_session = model.start_chat(history=chat_history)

        # Get the response from the chat model
        response = chat_session.send_message(user_query)

        # Return the response
        return jsonify({"answer": response.text})

    except Exception as e:
        logging.error(f"Error querying text: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000, debug=False)

