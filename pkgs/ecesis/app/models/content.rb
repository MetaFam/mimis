class Content < ApplicationRecord
  belongs_to :book
  belongs_to :data, class_name: 'Datum'
end
