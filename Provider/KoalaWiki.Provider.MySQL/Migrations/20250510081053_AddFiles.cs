using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoalaWiki.Provider.MySQL.Migrations
{
    /// <inheritdoc />
    public partial class AddFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OptimizedDirectoryStructure",
                table: "Warehouses",
                type: "longtext",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DependentFile",
                table: "DocumentCatalogs",
                type: "longtext",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Prompt",
                table: "DocumentCatalogs",
                type: "longtext",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OptimizedDirectoryStructure",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "DependentFile",
                table: "DocumentCatalogs");

            migrationBuilder.DropColumn(
                name: "Prompt",
                table: "DocumentCatalogs");
        }
    }
}
