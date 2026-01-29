using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JsonTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JsonTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GeneratorSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    JsonTemplateId = table.Column<int>(type: "int", nullable: false),
                    FieldConfigurations = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Headers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AuthType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AuthValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    JsonTemplateId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestConfigId = table.Column<int>(type: "int", nullable: false),
                    PresetUsed = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TotalRequests = table.Column<int>(type: "int", nullable: false),
                    SuccessCount = table.Column<int>(type: "int", nullable: false),
                    FailureCount = table.Column<int>(type: "int", nullable: false),
                    AvgResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    MinResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    MaxResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestExecutions", x => x.Id);
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestExecutionId = table.Column<int>(type: "int", nullable: false),
                    Index = table.Column<int>(type: "int", nullable: false),
                    RequestPayload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponseBody = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StatusCode = table.Column<int>(type: "int", nullable: false),
                    DurationMs = table.Column<double>(type: "float", nullable: false),
                    Error = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsSuccess = table.Column<bool>(type: "bit", nullable: false)
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
