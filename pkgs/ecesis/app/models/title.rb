class Title < ApplicationRecord
  has_many :books

  def to_s; name.to_s; end
end
