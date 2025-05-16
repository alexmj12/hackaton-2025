using System.Text.Json;
using RYGStatus.Server.Models;

namespace RYGStatus.Server.Services;

public class QuestionService : IQuestionService
{
    private readonly string _jsonFilePath;
    private static readonly List<Question> DefaultQuestions = new()
    {
        new Question { Id = 1, Text = "Are our supply lines secure?" },
        new Question { Id = 2, Text = "Is our communications network operational?" },
        new Question { Id = 3, Text = "Are our forces at full strength?" },
        new Question { Id = 4, Text = "Are our resources sufficient?" },
        new Question { Id = 5, Text = "Are our rebel cells coordinated?" },
        new Question { Id = 6, Text = "Is our training program effective?" },
        new Question { Id = 7, Text = "Are our intelligence reports accurate?" },
        new Question { Id = 8, Text = "Are our defensive positions secure?" },
        new Question { Id = 9, Text = "Are our operations successful?" },
        new Question { Id = 10, Text = "Is our security protocol maintained?" },
        new Question { Id = 11, Text = "Are our strategic plans updated?" },
        new Question { Id = 12, Text = "Are mission objectives being met?" },
        new Question { Id = 13, Text = "Is equipment maintenance current?" },
        new Question { Id = 14, Text = "Are our safe houses protected?" },
        new Question { Id = 15, Text = "Is morale among fighters high?" },
        new Question { Id = 16, Text = "Are our allies reliable?" },
        new Question { Id = 17, Text = "Is combat readiness satisfactory?" },
        new Question { Id = 18, Text = "Are evacuation routes confirmed?" },
        new Question { Id = 19, Text = "Is surveillance coverage complete?" },
        new Question { Id = 20, Text = "Are countermeasures prepared?" }
    };

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
                // If file doesn't exist, create it with default questions
                SaveQuestionsToFile(DefaultQuestions);
                return DefaultQuestions;
            }

            var jsonString = File.ReadAllText(_jsonFilePath);
            var questions = JsonSerializer.Deserialize<List<Question>>(jsonString);
            
            if (questions == null || !questions.Any())
            {
                // If file is empty or invalid, use default questions
                SaveQuestionsToFile(DefaultQuestions);
                return DefaultQuestions;
            }

            return questions;
        }
        catch (Exception ex)
        {
            // Log the error here if you have logging configured
            // For now, fallback to default questions if any error occurs
            return DefaultQuestions;
        }
    }

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