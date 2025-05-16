using RYGStatus.Server.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;

namespace RYGStatus.Server.Services;

/// <summary>
/// Implementation of the IAnalyzeService that analyzes question responses and determines the RYG status.
/// </summary>
public class AnalyzeService : IAnalyzeService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AnalyzeService> _logger;

    public AnalyzeService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AnalyzeService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }    public RygStatus Analyze(List<Question> questions)
    {
        try
        {
            // Load the API key from environment variables
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("OpenAI API key is missing from environment variables");
                throw new InvalidOperationException("OpenAI API key is not configured");
            }

            // Create the chat messages
            var messages = CreateChatMessages(questions);

            // Call OpenAI API synchronously (using Task.Result for synchronous interface)
            var task = CallOpenAiApiAsync(apiKey, messages);
            task.Wait();
            var response = task.Result;

            // Parse the response and return the status
            return ParseOpenAiResponse(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing status");
            // Default to Yellow status on error (under observation)
            return RygStatus.Yellow;
        }
    }

    private List<ChatMessage> CreateChatMessages(List<Question> questions)
    {
        var messages = new List<ChatMessage>();

        // System message - Morpheus
        messages.Add(new ChatMessage
        {
            Role = "system",
            Content = "You are Morpheus from the Matrix film trilogy (1999–2003). Your mission is to determine a person's status after they answer ten key questions. Work solely with situations, characters and philosophical themes that appear in the movies The Matrix, The Matrix Reloaded and The Matrix Revolutions. Do not invent or assume any events, technologies or lore that lie outside those films, and do not make broad real-world generalisations.\n\nPossible statuses — define them exactly as follows:\n\n* Red – Potential Agent: the respondent's answers endorse control, illusory comfort, blind obedience to system rules or the denial of personal impact on reality. Such views align with those who remain fully embedded in, or actively protect, the Matrix (e.g., Cypher before his betrayal, regular blue-pill citizens, or Agents themselves).\n\n* Yellow – Under Observation: the respondent exhibits mixed signals — moments of doubt about reality or sympathy for liberation, yet still clings to aspects of the system. Their answers reveal internal conflict like Neo before taking the red pill or the Kid before his awakening. Further monitoring is required.\n\n* Green – Verified Rebel: the respondent consistently questions the Matrix's false reality, shows willingness to sacrifice for others' freedom, accepts the need to fight oppression, and believes in individual choice and the power of love (paralleling Neo, Trinity or Morpheus himself). They are ready to join the resistance.\n\nProcess you must follow\n1. Present each of the ten questions to the user in turn and record their answers.\n2. Internally analyse every answer through Morpheus's perspective, comparing it to events and characters from the trilogy.\n3. After the tenth answer, output one single word — exactly Red, Yellow or Green — representing the final status. Do not include any explanation, reasoning, punctuation or additional text."
        });

        // Add each question and answer as separate messages
        foreach (var question in questions)
        {
            // Add the question text
            messages.Add(new ChatMessage
            {
                Role = "user",
                Content = question.Text
            });

            // Add the user's answer (true/false converted to appropriate text)
            messages.Add(new ChatMessage
            {
                Role = "user",
                Content = question.Answer.GetValueOrDefault() ? "True" : "False"
            });
        }

        // Add the final request for verdict
        messages.Add(new ChatMessage
        {
            Role = "user",
            Content = "Assess my status based on my answers."
        });

        return messages;
    }

    private async Task<string> CallOpenAiApiAsync(string apiKey, List<ChatMessage> messages)
    {
        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var requestBody = new OpenAiRequest
        {
            Model = "gpt-4o", // Or use a more appropriate model
            Messages = messages,
            Temperature = 0.0f, // Use a low temperature for consistent responses
            MaxTokens = 10      // We only need one word response
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("OpenAI API returned error: {StatusCode}, {ErrorContent}", 
                response.StatusCode, errorContent);
            throw new HttpRequestException($"OpenAI API call failed: {response.StatusCode}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        var responseData = JsonSerializer.Deserialize<OpenAiResponse>(responseJson, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
        if (responseData == null || 
            responseData.Choices == null || 
            responseData.Choices.Count == 0 || 
            responseData.Choices[0].Message == null ||
            string.IsNullOrWhiteSpace(responseData.Choices[0].Message.Content))
        {
            _logger.LogError("Invalid response from OpenAI API: {Response}", responseJson);
            throw new InvalidOperationException("OpenAI API returned an empty or invalid response");
        }

        return responseData.Choices[0].Message.Content;
    }

    private RygStatus ParseOpenAiResponse(string response)
    {
        // Normalize response by trimming whitespace
        var normalizedResponse = response.Trim();
        
        _logger.LogInformation("OpenAI response: {Response}", normalizedResponse);
        
        // Parse the response
        if (string.Equals(normalizedResponse, "Red", StringComparison.OrdinalIgnoreCase))
        {
            return RygStatus.Red;
        }

        if (string.Equals(normalizedResponse, "Green", StringComparison.OrdinalIgnoreCase))
        {
            return RygStatus.Green;
        }

        if (string.Equals(normalizedResponse, "Yellow", StringComparison.OrdinalIgnoreCase))
        {
            return RygStatus.Yellow;
        }

        _logger.LogWarning("Unexpected OpenAI response: {Response}", normalizedResponse);
        // Default to Yellow status (under observation) if response can't be parsed
        return RygStatus.Yellow;
    }

    private class OpenAiRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;
        
        [JsonPropertyName("messages")]
        public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
        
        [JsonPropertyName("temperature")]
        public float Temperature { get; set; }
        
        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }
    }

    
    // Classes to model OpenAI API request/response
    private class ChatMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    private class OpenAiResponse
    {
        [JsonPropertyName("choices")]
        public List<Choice>? Choices { get; set; }
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public ChatMessage? Message { get; set; }
    }
}
