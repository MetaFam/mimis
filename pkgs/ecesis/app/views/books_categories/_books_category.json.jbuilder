json.extract! books_category, :id, :book_id, :category_id, :created_at, :updated_at
json.url books_category_url(books_category, format: :json)
