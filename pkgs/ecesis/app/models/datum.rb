class Datum < ApplicationRecord
  has_many :shares, foreign_key: :data_id, dependent: :nullify
  has_many :contents, foreign_key: :data_id, dependent: :destroy
  has_many :books, through: :contents

  def ipfs_url
    "//ipfs.io/ipfs/#{ipfs_id}"
  end

  def guten_url
    "//gutenberg.org/ebooks/#{gutenberg_id}"
  end

  def url
    ipfs_id ? ipfs_url : guten_url
  end

  def to_s
    ipfs_id || gutenberg_id
  end
end
