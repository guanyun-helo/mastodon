class AddIscnIdToStatus < ActiveRecord::Migration[6.1]
  def change
    add_column :statuses, :iscn_id, :string
  end
end
