json.extract! datum, :id, :name, :size, :created_at, :updated_at
json.url datum_url(datum, format: :json)
