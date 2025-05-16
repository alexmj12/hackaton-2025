using RYGStatus.Server.Models;

namespace RYGStatus.Server.Services;

public interface IQuestionService
{
    List<Question> GetQuestions();
}