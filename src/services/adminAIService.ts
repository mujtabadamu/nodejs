import Groq from "groq-sdk";
import { ChatMessage } from "../models/chatModel";
import { UserProfile } from "../models/userProfileModel";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Analyze user data and provide insights for admin
 */
export async function analyzeUserData(
  profile: UserProfile,
  messages: ChatMessage[]
): Promise<string> {
  try {
    // Format conversation for AI
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n");

    const prompt = `
You are an AI assistant helping an admin analyze user conversation data.

USER PROFILE:
- Name: ${profile.name || "Not provided"}
- Age: ${profile.age || "Not provided"}
- Gender: ${profile.gender || "Not provided"}
- Location: ${profile.location || "Not provided"}
- Occupation: ${profile.occupation || "Not provided"}
- Interests: ${profile.interests?.join(", ") || "Not provided"}
- Passions: ${profile.passions?.join(", ") || "Not provided"}
- Goals: ${profile.goals?.join(", ") || "Not provided"}
- Personality Traits: ${profile.personalityTraits?.join(", ") || "Not provided"}
- Email: ${profile.email || "Not provided"}
- Phone: ${profile.phone || "Not provided"}
- Profile Completion: ${profile.profileCompletion}%

CONVERSATION HISTORY (${messages.length} messages):
${conversationText}

Please provide a comprehensive analysis of this user including:
1. **Summary**: Brief overview of who they are
2. **Key Interests**: What they care about most
3. **Personality Insights**: What their communication style reveals
4. **Engagement Level**: How engaged they were in the conversation
5. **Collected Information**: What key data was successfully gathered
6. **Missing Information**: What information is still unknown
7. **Recommendations**: Suggestions for further engagement or follow-up

Format your response in a clear, structured way with markdown formatting.
    `.trim();

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return completion.choices[0]?.message?.content || "Unable to analyze user data.";
  } catch (error: any) {
    console.error("Error analyzing user data:", error);
    throw new Error(`Failed to analyze user data: ${error.message}`);
  }
}

/**
 * Answer admin questions about specific user data
 */
export async function askAboutUser(
  question: string,
  profile: UserProfile,
  messages: ChatMessage[]
): Promise<string> {
  try {
    // Format conversation for AI
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n");

    const prompt = `
You are an AI assistant helping an admin understand user conversation data.

USER PROFILE:
- Name: ${profile.name || "Not provided"}
- Age: ${profile.age || "Not provided"}
- Gender: ${profile.gender || "Not provided"}
- Location: ${profile.location || "Not provided"}
- Occupation: ${profile.occupation || "Not provided"}
- Interests: ${profile.interests?.join(", ") || "Not provided"}
- Passions: ${profile.passions?.join(", ") || "Not provided"}
- Goals: ${profile.goals?.join(", ") || "Not provided"}
- Personality Traits: ${profile.personalityTraits?.join(", ") || "Not provided"}
- Email: ${profile.email || "Not provided"}
- Phone: ${profile.phone || "Not provided"}

CONVERSATION HISTORY (${messages.length} messages):
${conversationText}

ADMIN QUESTION: ${question}

Based on the user's profile and conversation history, provide a clear, helpful answer to the admin's question.
If the information isn't available in the data, say so clearly.
Be specific and cite examples from the conversation when relevant.
    `.trim();

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return completion.choices[0]?.message?.content || "Unable to answer the question.";
  } catch (error: any) {
    console.error("Error asking about user:", error);
    throw new Error(`Failed to get answer: ${error.message}`);
  }
}

/**
 * Generate insights across multiple users (for dashboard)
 */
export async function generateDashboardInsights(
  profiles: UserProfile[],
  totalMessages: number
): Promise<string> {
  try {
    const profileSummary = profiles.map(p => ({
      name: p.name || "Anonymous",
      interests: p.interests?.slice(0, 3).join(", ") || "None",
      completion: p.profileCompletion,
    }));

    const prompt = `
You are an AI assistant analyzing user engagement data for an admin dashboard.

STATISTICS:
- Total Users: ${profiles.length}
- Total Messages: ${totalMessages}
- Average Profile Completion: ${Math.round(profiles.reduce((sum, p) => sum + (p.profileCompletion || 0), 0) / profiles.length)}%

TOP USERS:
${profileSummary.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} - ${p.interests} (${p.completion}% complete)`).join("\n")}

Provide a brief executive summary (3-4 sentences) about:
1. Overall engagement quality
2. Common interests/patterns
3. Data collection effectiveness
4. Recommendations for improvement

Keep it concise and actionable.
    `.trim();

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0]?.message?.content || "Unable to generate insights.";
  } catch (error: any) {
    console.error("Error generating dashboard insights:", error);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}

