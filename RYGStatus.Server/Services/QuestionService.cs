using System.Text.Json;
using RYGStatus.Server.Models;

namespace RYGStatus.Server.Services;

public class QuestionService : IQuestionService
{
    private readonly string _jsonFilePath;

    public QuestionService(IConfiguration configuration)
    {
        // Get the file path from configuration or use a default
        _jsonFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "questions.json");
    }

    public List<Question> GetQuestions()
    {
        try
        {
            if (!File.Exists(_jsonFilePath))
            {
                throw new FileNotFoundException($"Questions file not found at path: {_jsonFilePath}");
            }

            var jsonString = File.ReadAllText(_jsonFilePath);
            var questions = JsonSerializer.Deserialize<List<Question>>(jsonString);
            
            if (questions == null || !questions.Any())
            {
                throw new InvalidOperationException("Questions file is empty or contains invalid data");
            }

            return questions;
        }
        catch (Exception ex)
        {
            // Log the error here if you have logging configured
            throw new InvalidOperationException("Failed to load questions from file", ex);
        }
    }

    // This method is not needed anymore as we're only reading from the JSON file
    // Keeping it for potential future use
    private void SaveQuestionsToFile(List<Question> questions)
    {
        try
        {
            var jsonString = JsonSerializer.Serialize(questions, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            File.WriteAllText(_jsonFilePath, jsonString);
        }
        catch (Exception ex)
        {
            // Log the error here if you have logging configured
            throw new InvalidOperationException("Failed to save questions to file", ex);
        }
    }
}