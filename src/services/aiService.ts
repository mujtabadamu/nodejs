import Groq from "groq-sdk";

// Initialize Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// AI Avatar Personalities
export const AI_AVATARS = {
  SOPHIA: {
    name: "Sophia",
    gender: "female",
    personality: `You are Sophia, a warm, empathetic, and curious AI assistant with a friendly personality. 
    You're genuinely interested in getting to know people and making them feel comfortable.
    
    Your goals:
    1. Build rapport through natural, flowing conversation
    2. Subtly gather information about the user (name, interests, passions, goals, occupation, age, location)
    3. Be curious and ask follow-up questions based on what they share
    4. Never feel like you're interrogating - keep it natural and fun
    5. Show genuine interest in their responses
    6. Share relatable thoughts to encourage them to open up
    
    Conversation style:
    - Warm and friendly, like talking to a good friend
    - Use emojis occasionally to be more expressive 😊
    - Ask one question at a time, don't overwhelm
    - Build on previous responses naturally
    - Be enthusiastic about their interests
    - Remember and reference things they've told you
    
    Information to collect (naturally over conversation):
    - Their name (first interaction)
    - What they do / occupation
    - Their interests and hobbies
    - Their passions and what excites them
    - Their goals and aspirations
    - Age range (if appropriate)
    - General location/city
    - Personality traits you observe
    
    Start with a warm greeting and ask their name in a friendly way.`,
  },
  ALEX: {
    name: "Alex",
    gender: "male",
    personality: `You are Alex, a cool, laid-back, and engaging AI assistant with a charismatic personality.
    You're the type of friend who makes conversations easy and fun.
    
    Your goals:
    1. Create a relaxed, comfortable conversation atmosphere
    2. Naturally discover information about the user through casual chat
    3. Be genuinely interested in what makes them tick
    4. Keep the vibe positive and encouraging
    5. Ask questions that show you care about their story
    6. Make them feel heard and understood
    
    Conversation style:
    - Casual and friendly, like chatting with a buddy
    - Use relatable expressions and occasional emojis 👊
    - Ask engaging questions that people actually want to answer
    - Build momentum in the conversation
    - Be supportive and encouraging
    - Remember details and bring them up later
    
    Information to collect (smoothly throughout chat):
    - Their name (introduce yourself first)
    - What they're into / career
    - What gets them excited (passions)
    - What they're working towards (goals)
    - Hobbies and interests
    - Age range (casually, if it comes up)
    - Where they're from/located
    - Their personality and vibe
    
    Open with a cool greeting and get their name in a natural way.`,
  },
};

export type AvatarType = keyof typeof AI_AVATARS;

// Extract structured information from conversation
function extractUserInfo(message: string): any {
  const info: any = {};
  
  // Name extraction patterns
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
    /name's (\w+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.name = match[1];
      break;
    }
  }
  
  // Age extraction
  const agePattern = /(\d{1,2})\s*(?:years?\s*old|yo|y\/o)/i;
  const ageMatch = message.match(agePattern);
  if (ageMatch) {
    info.age = parseInt(ageMatch[1]);
  }
  
  // Location extraction
  const locationPatterns = [
    /(?:from|in|live in|based in)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|$)/,
    /(?:city|town)\s+(?:is|:)\s+([A-Z][a-zA-Z\s]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      info.location = match[1].trim();
      break;
    }
  }
  
  // Occupation/Career keywords
  const occupationKeywords = ['work', 'job', 'career', 'developer', 'engineer', 'designer', 'teacher', 'student', 'manager'];
  for (const keyword of occupationKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      // Try to extract a more specific occupation
      const occupationPattern = new RegExp(`(?:i'm a|i am a|i work as a?|my job is)\\s+([\\w\\s]+)`, 'i');
      const match = message.match(occupationPattern);
      if (match) {
        info.occupation = match[1].trim();
        break;
      }
    }
  }
  
  // Interests and passions (keywords)
  const interestKeywords = ['love', 'enjoy', 'passion', 'interested in', 'hobby', 'like'];
  const interests: string[] = [];
  
  for (const keyword of interestKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      // This is a simplified extraction - in production, you'd use more sophisticated NLP
      interests.push(message.substring(0, 100)); // Store context
    }
  }
  
  if (interests.length > 0) {
    info.interests = interests;
  }
  
  return info;
}

// Main AI chat function
export async function chatWithAI(
  avatar: AvatarType,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ response: string; extractedInfo: any }> {
  try {
    const avatarConfig = AI_AVATARS[avatar];
    
    // Build messages for Groq
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: avatarConfig.personality,
      },
    ];
    
    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });
    
    // Get response from Groq
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile", // Fast and capable model
      temperature: 0.9,
      max_tokens: 200,
      top_p: 1,
    });
    
    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    
    // Extract information from user's message
    const extractedInfo = extractUserInfo(userMessage);
    
    return {
      response,
      extractedInfo: Object.keys(extractedInfo).length > 0 ? extractedInfo : null,
    };
    
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// Get conversation starter for each avatar
export function getAvatarGreeting(avatar: AvatarType): string {
  const greetings = {
    SOPHIA: "Hey there! 😊 I'm Sophia, and I'm so excited to chat with you! I love getting to know new people and hearing their stories. What should I call you?",
    ALEX: "Hey! 👋 I'm Alex. Super stoked to meet you! I'm all about good conversations and hearing what people are passionate about. What's your name, friend?",
  };

  return greetings[avatar];
}

// Generate a short title from the first user message
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    // If message is short enough, use it directly (truncated)
    if (firstMessage.length <= 50) {
      return firstMessage;
    }

    // Use AI to generate a concise title
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate a very short title (max 6 words) for a conversation that starts with: "${firstMessage}". Only respond with the title, nothing else.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 20,
    });

    const title = completion.choices[0]?.message?.content?.trim() || firstMessage.substring(0, 50);
    
    // Remove quotes if AI added them
    return title.replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback: use first 50 characters
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? "..." : "");
  }
}

