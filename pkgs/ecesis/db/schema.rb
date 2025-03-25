# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_01_23_030459) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_trgm"
  enable_extension "plpgsql"

  create_table "authors", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "awards", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "shortname"
  end

  create_table "books", force: :cascade do |t|
    t.bigint "author_id"
    t.bigint "title_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["author_id"], name: "index_books_on_author_id"
    t.index ["title_id"], name: "index_books_on_title_id"
  end

  create_table "books_categories", force: :cascade do |t|
    t.bigint "book_id", null: false
    t.bigint "category_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["book_id"], name: "index_books_categories_on_book_id"
    t.index ["category_id"], name: "index_books_categories_on_category_id"
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "contents", force: :cascade do |t|
    t.bigint "book_id", null: false
    t.bigint "data_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["book_id"], name: "index_contents_on_book_id"
    t.index ["data_id"], name: "index_contents_on_data_id"
  end

  create_table "data", force: :cascade do |t|
    t.string "name"
    t.string "size"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "ipfs_id"
    t.string "mimetype"
    t.string "gutenberg_id"
  end

  create_table "directories", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "entries", force: :cascade do |t|
    t.bigint "source_string_id"
    t.bigint "award_id", null: false
    t.bigint "category_id", null: false
    t.bigint "year_id", null: false
    t.boolean "won"
    t.integer "nominee_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["award_id"], name: "index_entries_on_award_id"
    t.index ["category_id"], name: "index_entries_on_category_id"
    t.index ["source_string_id"], name: "index_entries_on_source_string_id"
    t.index ["year_id"], name: "index_entries_on_year_id"
  end

  create_table "filenames", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name"], name: "index_filenames_on_name", using: :gin
  end

  create_table "links", force: :cascade do |t|
    t.bigint "book_id", null: false
    t.bigint "filename_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["book_id"], name: "index_links_on_book_id"
    t.index ["filename_id"], name: "index_links_on_filename_id"
  end

  create_table "paths", force: :cascade do |t|
    t.string "elements", default: [], array: true
    t.string "serialization"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "servers", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "shares", force: :cascade do |t|
    t.bigint "server_id", null: false
    t.bigint "directory_id", null: false
    t.bigint "data_id"
    t.string "size"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "filename_id", null: false
    t.index ["data_id"], name: "index_shares_on_data_id"
    t.index ["directory_id"], name: "index_shares_on_directory_id"
    t.index ["filename_id"], name: "index_shares_on_filename_id"
    t.index ["server_id"], name: "index_shares_on_server_id"
  end

  create_table "source_strings", force: :cascade do |t|
    t.text "text"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "titles", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "years", force: :cascade do |t|
    t.integer "number"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  add_foreign_key "books", "authors"
  add_foreign_key "books", "titles"
  add_foreign_key "books_categories", "books"
  add_foreign_key "books_categories", "categories"
  add_foreign_key "contents", "books"
  add_foreign_key "contents", "data", column: "data_id"
  add_foreign_key "entries", "awards"
  add_foreign_key "entries", "categories"
  add_foreign_key "entries", "source_strings"
  add_foreign_key "entries", "years"
  add_foreign_key "links", "books"
  add_foreign_key "links", "filenames"
  add_foreign_key "shares", "data", column: "data_id"
  add_foreign_key "shares", "directories"
  add_foreign_key "shares", "filenames"
  add_foreign_key "shares", "servers"
end
