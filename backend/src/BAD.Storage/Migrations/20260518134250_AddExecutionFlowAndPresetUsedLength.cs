using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutionFlowAndPresetUsedLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExecutionFlows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DefinitionVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    DefinitionJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecutionFlows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FlowRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ExecutionFlowId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    RequestCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ExecutionMode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IntervalMs = table.Column<int>(type: "INTEGER", nullable: false),
                    MutatePerIteration = table.Column<bool>(type: "INTEGER", nullable: false),
                    Error = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlowRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlowRuns_ExecutionFlows_ExecutionFlowId",
                        column: x => x.ExecutionFlowId,
                        principalTable: "ExecutionFlows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FlowRunSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FlowRunId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientNodeId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    TestExecutionId = table.Column<int>(type: "INTEGER", nullable: true),
                    Error = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FinishedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlowRunSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlowRunSteps_FlowRuns_FlowRunId",
                        column: x => x.FlowRunId,
                        principalTable: "FlowRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FlowRunSteps_TestExecutions_TestExecutionId",
                        column: x => x.TestExecutionId,
                        principalTable: "TestExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExecutionFlows_Name",
                table: "ExecutionFlows",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_FlowRuns_ExecutionFlowId",
                table: "FlowRuns",
                column: "ExecutionFlowId");

            migrationBuilder.CreateIndex(
                name: "IX_FlowRuns_StartedAt",
                table: "FlowRuns",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FlowRunSteps_FlowRunId_ClientNodeId",
                table: "FlowRunSteps",
                columns: new[] { "FlowRunId", "ClientNodeId" });

            migrationBuilder.CreateIndex(
                name: "IX_FlowRunSteps_TestExecutionId",
                table: "FlowRunSteps",
                column: "TestExecutionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlowRunSteps");

            migrationBuilder.DropTable(
                name: "FlowRuns");

            migrationBuilder.DropTable(
                name: "ExecutionFlows");
        }
    }
}
