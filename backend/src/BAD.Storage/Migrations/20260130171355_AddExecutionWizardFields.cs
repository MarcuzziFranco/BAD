using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutionWizardFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExecutedAt",
                table: "TestResults",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "RequestHeaders",
                table: "TestResults",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponseHeaders",
                table: "TestResults",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BaseJson",
                table: "TestExecutions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BodyMode",
                table: "TestExecutions",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "none");

            migrationBuilder.AddColumn<string>(
                name: "ExecutionMode",
                table: "TestExecutions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "sequential");

            migrationBuilder.AddColumn<DateTime>(
                name: "FinishedAt",
                table: "TestExecutions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IntervalMs",
                table: "TestExecutions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "MutatePerIteration",
                table: "TestExecutions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MutationsConfig",
                table: "TestExecutions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TestExecutions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.AddColumn<int>(
                name: "TemplateId",
                table: "TestExecutions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_ExecutedAt",
                table: "TestResults",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_Status",
                table: "TestExecutions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TestExecutions_TemplateId",
                table: "TestExecutions",
                column: "TemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_TestExecutions_JsonTemplates_TemplateId",
                table: "TestExecutions",
                column: "TemplateId",
                principalTable: "JsonTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TestExecutions_JsonTemplates_TemplateId",
                table: "TestExecutions");

            migrationBuilder.DropIndex(
                name: "IX_TestResults_ExecutedAt",
                table: "TestResults");

            migrationBuilder.DropIndex(
                name: "IX_TestExecutions_Status",
                table: "TestExecutions");

            migrationBuilder.DropIndex(
                name: "IX_TestExecutions_TemplateId",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "ExecutedAt",
                table: "TestResults");

            migrationBuilder.DropColumn(
                name: "RequestHeaders",
                table: "TestResults");

            migrationBuilder.DropColumn(
                name: "ResponseHeaders",
                table: "TestResults");

            migrationBuilder.DropColumn(
                name: "BaseJson",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "BodyMode",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "ExecutionMode",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "FinishedAt",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "IntervalMs",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "MutatePerIteration",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "MutationsConfig",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TestExecutions");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "TestExecutions");
        }
    }
}
