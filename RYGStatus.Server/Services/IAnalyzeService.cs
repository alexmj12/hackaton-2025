using RYGStatus.Server.Models;

namespace RYGStatus.Server.Services;

public interface IAnalyzeService
{
    RygStatus Analyze(List<Question> questions);
}
