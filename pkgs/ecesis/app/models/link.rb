class Link < ApplicationRecord
  belongs_to :book
  belongs_to :filename

  def to_s
    "#{book} = #{filename}"
  end
end
