using Microsoft.AspNetCore.Mvc;
using RYGStatus.Server.Models;
using RYGStatus.Server.Services;

namespace RYGStatus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RygStatusController : ControllerBase
    {
        private readonly IQuestionService _questionService;
        private readonly IAnalyzeService _analyzeService;

        public RygStatusController(IQuestionService questionService, IAnalyzeService analyzeService)
        {
            _questionService = questionService;
            _analyzeService = analyzeService;
        }

        [HttpGet("questions")]
        public ActionResult<IEnumerable<Question>> GetQuestions()
        {
            var random = new Random();
            var questions = _questionService.GetQuestions();
            var randomQuestions = questions.OrderBy(x => random.Next()).Take(5);
            return Ok(randomQuestions.Select(q => new { q.Id, q.Text }));
        }

        [HttpGet("test")]
        public ActionResult<RygStatus> Test()
        {
            var questions = _questionService.GetQuestions();

            return _analyzeService.Analyze(questions);
        }

        [HttpPost("submit")]
        public ActionResult<RygStatus> SubmitResponses([FromBody] List<Question> responses)
        {
            return _analyzeService.Analyze(responses);
        }
    }
}