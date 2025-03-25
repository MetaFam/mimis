class Author < ApplicationRecord
  has_many :books, dependent: :destroy
  has_many :titles, through: :books

  def to_s; name; end
end
