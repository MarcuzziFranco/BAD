using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class InitialSqlite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JsonTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JsonTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GeneratorSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    JsonTemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    FieldConfigurations = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeneratorSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeneratorSettings_JsonTemplates_JsonTemplateId",
                        column: x => x.JsonTemplateId,
                        principalTable: "JsonTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RequestConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Method = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Headers = table.Column<string>(type: "TEXT", nullable: true),
                    AuthType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    AuthValue = table.Column<string>(type: "TEXT", nullable: true),
                    JsonTemplateId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestConfigs_JsonTemplates_JsonTemplateId",
                        column: x => x.JsonTemplateId,
                        principalTable: "JsonTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TestExecutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RequestConfigId = table.Column<int>(type: "INTEGER", nullable: false),
                    PresetUsed = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "pending"),
                    ExecutionMode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "sequential"),
                    IntervalMs = table.Column<int>(type: "INTEGER", nullable: false),
                    MutatePerIteration = table.Column<bool>(type: "INTEGER", nullable: false),
                    BodyMode = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false, defaultValue: "none"),
                    BaseJson = table.Column<string>(type: "TEXT", nullable: true),
                    MutationsConfig = table.Column<string>(type: "TEXT", nullable: true),
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: true),
                    TotalRequests = table.Column<int>(type: "INTEGER", nullable: false),
                    SuccessCount = table.Column<int>(type: "INTEGER", nullable: false),
                    FailureCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AvgResponseTimeMs = table.Column<double>(type: "REAL", nullable: false),
                    MinResponseTimeMs = table.Column<double>(type: "REAL", nullable: false),
                    MaxResponseTimeMs = table.Column<double>(type: "REAL", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestExecutions_JsonTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "JsonTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TestExecutions_RequestConfigs_RequestConfigId",
                        column: x => x.RequestConfigId,
                        principalTable: "RequestConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TestExecutionId = table.Column<int>(type: "INTEGER", nullable: false),
                    Index = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestPayload = table.Column<string>(type: "TEXT", nullable: false),
                    RequestHeaders = table.Column<string>(type: "TEXT", nullable: true),
                    ResponseBody = table.Column<string>(type: "TEXT", nullable: true),
                    ResponseHeaders = table.Column<string>(type: "TEXT", nullable: true),
                    StatusCode = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMs = table.Column<double>(type: "REAL", nullable: false),
                    Error = table.Column<string>(type: "TEXT", nullable: true),
                    IsSuccess = table.Column<bool>(type: "INTEGER", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestResults_TestExecutions_TestExecutionId",
                        column: x => x.TestExecutionId,
                        principalTable: "TestExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratorSettings_JsonTemplateId",
                table: "GeneratorSettings",
                column: "JsonTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_JsonTemplates_Name",
                table: "JsonTemplates",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_RequestConfigs_JsonTemplateId",
                table: "RequestConfigs",
                column: "JsonTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_ExecutedAt",
                table: "TestExecutions",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_RequestConfigId",
                table: "TestExecutions",
                column: "RequestConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_Status",
                table: "TestExecutions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_TemplateId",
                table: "TestExecutions",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_ExecutedAt",
                table: "TestResults",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_TestExecutionId",
                table: "TestResults",
                column: "TestExecutionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GeneratorSettings");

            migrationBuilder.DropTable(
                name: "TestResults");

            migrationBuilder.DropTable(
                name: "TestExecutions");

            migrationBuilder.DropTable(
                name: "RequestConfigs");

            migrationBuilder.DropTable(
                name: "JsonTemplates");
        }
    }
}
