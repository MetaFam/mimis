class Server < ApplicationRecord
  has_many :shares, dependent: :destroy
  has_many :directories, through: :shares

  def to_s; name; end
end
