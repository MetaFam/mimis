class Year < ApplicationRecord
  has_many :entries
  has_many(
    :categories,
    -> { distinct },
    through: :entries
  )

  def to_s; number.to_s; end
end
