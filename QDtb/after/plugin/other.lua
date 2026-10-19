-- Local plugins and configuration {{{
-- neovim
vim.cmd.packadd("plenary.nvim")
vim.cmd.packadd("telescope.nvim")
require("plugins.QDtb.package_json")
require("plugins.QDtb.autosave")
require("plugins.QDtb.window_title")
require("plugins.code_style")
require("plugins.session_manager")
require("plugins.fold_this").setup({
	-- Options routed to fold_this.lua
	core = {
		default_level = 99,
		enable_keymap = true,
	},
	-- Options routed to fold_navigation.lua
	navigation = {
		enable_keymaps = true,
		next_key = "zj",
		prev_key = "zk",
		center_on_jump = true,
	},
})
require("telescope").setup({
	defaults = {
		mappings = {
			i = { ["<Esc>"] = require("telescope.actions").close },
		},
	},
})
-- }}}
-- Footer
-- vim:foldmethod=marker:foldlevel=1
