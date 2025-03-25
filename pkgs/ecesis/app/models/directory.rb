class Directory < ApplicationRecord
  has_many :shares, dependent: :destroy

  def to_s; name; end
end
