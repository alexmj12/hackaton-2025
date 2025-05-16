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
    
        public RygStatusController(IQuestionService questionService)
        {
            _questionService = questionService;
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

            var trueCount = responses.Count(r => r.Answer.GetValueOrDefault());

            if (responses.All(r => r.Answer.GetValueOrDefault()))
                return Ok(RygStatus.Red);
            else if (trueCount > 4)
                return Ok(RygStatus.Yellow);
            else
                return Ok(RygStatus.Green);
        }
    }
}