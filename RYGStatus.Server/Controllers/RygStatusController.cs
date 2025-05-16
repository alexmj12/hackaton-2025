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

        [HttpPost("submit")]
        public ActionResult<RygStatus> SubmitResponses([FromBody] List<Question> responses)
        {
            if (responses.Any(r => r.Answer == null))
            {
                return BadRequest("All questions must be answered before submitting.");
            }

            var analysisResult = _analyzeService.Analyze(responses);
            return Ok(analysisResult);
        }
    }
}