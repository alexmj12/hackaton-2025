using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;
using RYGStatus.Server.Controllers;
using RYGStatus.Server.Models;
using RYGStatus.Server.Services;

namespace RYGStatus.Tests.Controllers
{
    public class RygStatusControllerTests
    {
        private readonly Mock<IQuestionService> _mockQuestionService;
        private readonly Mock<IAnalyzeService> _mockAnalyzeService;
        private readonly RygStatusController _controller;
        private readonly List<Question> _sampleQuestions;

        public RygStatusControllerTests()
        {
            _mockQuestionService = new Mock<IQuestionService>();
            _mockAnalyzeService = new Mock<IAnalyzeService>();
            _controller = new RygStatusController(_mockQuestionService.Object, _mockAnalyzeService.Object);
            
            _sampleQuestions = new List<Question>
            {
                new Question { Id = 1, Text = "Question 1", Answer = false },
                new Question { Id = 2, Text = "Question 2", Answer = false },
                new Question { Id = 3, Text = "Question 3", Answer = false },
                new Question { Id = 4, Text = "Question 4", Answer = false },
                new Question { Id = 5, Text = "Question 5", Answer = false }
            };
        }

        [Fact]
        public void GetQuestions_ShouldReturnFiveRandomizedQuestions()
        {
            // Arrange
            var questions = Enumerable.Range(1, 10)
                .Select(i => new Question { Id = i, Text = $"Question {i}" })
                .ToList();

            _mockQuestionService.Setup(x => x.GetQuestions())
                .Returns(questions);

            // Act
            var firstResult = _controller.GetQuestions();
            var secondResult = _controller.GetQuestions();

            // Assert
            var firstQuestions = GetQuestionList(firstResult);
            var secondQuestions = GetQuestionList(secondResult);

            // Verify both results have 5 questions
            firstQuestions.Count.Should().Be(5);
            secondQuestions.Count.Should().Be(5);

            // Verify questions are different (randomized)
            // Note: There's a tiny chance this could fail randomly, but it's extremely unlikely
            firstQuestions.Should().NotBeEquivalentTo(secondQuestions);
        }

        [Fact]
        public void GetQuestions_WithLessThanFiveQuestions_ShouldReturnAllQuestions()
        {
            // Arrange
            var questions = new List<Question>
            {
                new Question { Id = 1, Text = "Question 1" },
                new Question { Id = 2, Text = "Question 2" },
                new Question { Id = 3, Text = "Question 3" }
            };

            _mockQuestionService.Setup(x => x.GetQuestions())
                .Returns(questions);

            // Act
            var result = _controller.GetQuestions();

            // Assert
            var returnedQuestions = GetQuestionList(result);
            returnedQuestions.Count.Should().Be(3);
            returnedQuestions.Select(q => q.id).Should().BeEquivalentTo(new[] { 1, 2, 3 });
        }

        [Fact]
        public void GetQuestions_WithEmptyQuestionList_ShouldReturnEmptyList()
        {
            // Arrange
            _mockQuestionService.Setup(x => x.GetQuestions())
                .Returns(new List<Question>());

            // Act
            var result = _controller.GetQuestions();

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result.Result);
            var questions = actionResult.Value as System.Collections.IEnumerable;
            questions.Should().NotBeNull();
            questions!.Cast<object>().Count().Should().Be(0);
        }

        [Theory]
        [InlineData(0, RygStatus.Green)]  // No true answers = Green
        [InlineData(4, RygStatus.Green)]  // 4 true answers = Green
        [InlineData(5, RygStatus.Red)]    // All true = Red
        public void SubmitResponses_ShouldReturnCorrectStatus(int trueCount, RygStatus expectedStatus)
        {
            // Arrange
            var responses = _sampleQuestions.Select((q, i) => new Question 
            { 
                Id = q.Id, 
                Text = q.Text, 
                Answer = i < trueCount 
            }).ToList();

            _mockAnalyzeService.Setup(x => x.Analyze(It.IsAny<List<Question>>()))
                .Returns(expectedStatus);

            // Act
            var result = _controller.SubmitResponses(responses);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result.Result);
            actionResult.StatusCode.Should().Be(200);
            actionResult.Value.Should().Be(expectedStatus);
            
            _mockAnalyzeService.Verify(x => x.Analyze(It.Is<List<Question>>(list => 
                list.Count == responses.Count && 
                list.Count(q => q.Answer.GetValueOrDefault()) == trueCount)), 
                Times.Once);
        }

        [Fact]
        public void SubmitResponses_WithNullAnswers_ShouldReturnBadRequest()
        {
            // Arrange
            var responses = new List<Question> 
            { 
                new Question { Id = 1, Text = "Question 1", Answer = null }
            };

            // Act
            var result = _controller.SubmitResponses(responses);

            // Assert
            var actionResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            actionResult.StatusCode.Should().Be(400);
            actionResult.Value.Should().Be("All questions must be answered before submitting.");
            
            _mockAnalyzeService.Verify(x => x.Analyze(It.IsAny<List<Question>>()), Times.Never);
        }

        [Fact]
        public void SubmitResponses_WithEmptyList_ShouldReturnGreenStatus()
        {
            // Arrange
            var responses = new List<Question>();
            _mockAnalyzeService.Setup(x => x.Analyze(It.IsAny<List<Question>>()))
                .Returns(RygStatus.Green);

            // Act
            var result = _controller.SubmitResponses(responses);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result.Result);
            actionResult.StatusCode.Should().Be(200);
            actionResult.Value.Should().Be(RygStatus.Green);

            _mockAnalyzeService.Verify(x => x.Analyze(responses), Times.Once);
        }

        [Fact]
        public void SubmitResponses_WithMixedAnswers_ShouldCallAnalyzeWithCorrectData()
        {
            // Arrange
            var responses = new List<Question>
            {
                new Question { Id = 1, Text = "Q1", Answer = true },
                new Question { Id = 2, Text = "Q2", Answer = false },
                new Question { Id = 3, Text = "Q3", Answer = true }
            };            List<Question>? capturedResponses = null;
            _mockAnalyzeService.Setup(x => x.Analyze(It.IsAny<List<Question>>()))
                .Callback<List<Question>>(r => capturedResponses = r)
                .Returns(RygStatus.Green);

            // Act
            var result = _controller.SubmitResponses(responses);

            // Assert
            capturedResponses.Should().NotBeNull();
            capturedResponses.Should().HaveCount(3);
            capturedResponses.Should().BeEquivalentTo(responses);
        }

        #region Helper Methods
        private static List<(int id, string text)> GetQuestionList(ActionResult<IEnumerable<Question>> result)
        {
            var actionResult = Assert.IsType<OkObjectResult>(result.Result);
            var questions = actionResult.Value as System.Collections.IEnumerable;
            questions.Should().NotBeNull();

            var questionsList = new List<(int id, string text)>();
            foreach (dynamic item in questions)
            {
                var type = item.GetType();
                var propId = type.GetProperty("Id");
                var propText = type.GetProperty("Text");
                var id = propId?.GetValue(item);
                var text = propText?.GetValue(item); 
                questionsList.Add((id, text));
            }

            return questionsList;
        }
        #endregion
    }
}
