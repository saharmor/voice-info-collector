import os
import json
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print("OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.")
    openai_client = None
else:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

def handle_chat_request(user_input, schema):
    if not openai_client:
        return {"error": "OpenAI API key is not set. Please contact the administrator."}

    # Prepare the messages for the chat
    messages = [
        {"role": "system", "content": f"You are an AI assistant conducting an onboarding conversation. Collect information based on this schema: {json.dumps(schema)}"},
        {"role": "user", "content": user_input}
    ]

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={ "type": "json_object" }
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("OpenAI returned an empty response.")
        
        # Parse the JSON response
        parsed_content = json.loads(content)
        return {
            "message": parsed_content.get("response", ""),
            "collected_info": parsed_content.get("collected_info", {})
        }
    except Exception as e:
        print(f"Error in OpenAI request: {str(e)}")
        return {"error": "An error occurred while processing your request."}
