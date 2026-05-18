using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDataPresetDescriptionUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GeneratorSettings_JsonTemplateId",
                table: "GeneratorSettings");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "GeneratorSettings",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "GeneratorSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.Sql("UPDATE GeneratorSettings SET UpdatedAt = CreatedAt;");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratorSettings_JsonTemplateId_Name",
                table: "GeneratorSettings",
                columns: new[] { "JsonTemplateId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GeneratorSettings_JsonTemplateId_Name",
                table: "GeneratorSettings");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "GeneratorSettings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "GeneratorSettings");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratorSettings_JsonTemplateId",
                table: "GeneratorSettings",
                column: "JsonTemplateId");
        }
    }
}
