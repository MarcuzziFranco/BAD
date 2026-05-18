using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddSourceGroupToTemplatesAndServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceGroup",
                table: "RequestConfigs",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.AddColumn<string>(
                name: "SourceGroup",
                table: "JsonTemplates",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.CreateIndex(
                name: "IX_RequestConfigs_SourceGroup",
                table: "RequestConfigs",
                column: "SourceGroup");

            migrationBuilder.CreateIndex(
                name: "IX_JsonTemplates_SourceGroup",
                table: "JsonTemplates",
                column: "SourceGroup");

            migrationBuilder.Sql("""
                UPDATE JsonTemplates
                SET SourceGroup = (
                    SELECT Name FROM ApiCatalogs WHERE ApiCatalogs.Id = JsonTemplates.ApiCatalogId
                )
                WHERE ApiCatalogId IS NOT NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE RequestConfigs
                SET SourceGroup = (
                    SELECT Name FROM ApiCatalogs WHERE ApiCatalogs.Id = RequestConfigs.ApiCatalogId
                )
                WHERE ApiCatalogId IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RequestConfigs_SourceGroup",
                table: "RequestConfigs");

            migrationBuilder.DropIndex(
                name: "IX_JsonTemplates_SourceGroup",
                table: "JsonTemplates");

            migrationBuilder.DropColumn(
                name: "SourceGroup",
                table: "RequestConfigs");

            migrationBuilder.DropColumn(
                name: "SourceGroup",
                table: "JsonTemplates");
        }
    }
}
