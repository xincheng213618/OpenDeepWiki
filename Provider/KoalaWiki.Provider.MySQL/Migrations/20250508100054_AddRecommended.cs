using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoalaWiki.Provider.MySQL.Migrations
{
    /// <inheritdoc />
    public partial class AddRecommended : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecommended",
                table: "Warehouses",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRecommended",
                table: "Warehouses");
        }
    }
}
