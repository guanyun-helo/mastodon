class AddSupportLikerToStatuses < ActiveRecord::Migration[6.1]
  def change
    add_column :statuses, :support_likers, :text, array: true, default: []
  end
end
