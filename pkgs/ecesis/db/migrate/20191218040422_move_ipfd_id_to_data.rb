class MoveIpfdIdToData < ActiveRecord::Migration[6.0]
  def change
    remove_column :shares, :ipfs_id
    add_column :data, :ipfs_id, :string
  end
end
