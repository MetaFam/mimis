class AddIpfsIdToShare < ActiveRecord::Migration[6.0]
  def change
    add_column :shares, :ipfs_id, :string
  end
end
