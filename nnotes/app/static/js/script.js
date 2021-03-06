Vue.config.devtools = true
var v = new Vue({
  el: "#root",
  data: {
    user: null,
    logged: false,
    category: null,
    notes: null,
    ss: '',
    sort_r: false,
    search: '',
    flr: {
      eq: {
        favorite: null,
        category: null
      },
      nq: {
        favorite: null,
        category: null
      },
      lt: {
        timeEnd: null
      },
      gt: {
        timeStart: null
      }
    }
  },
  computed: {
    range: function() {
      if (this.notes === null) {
        return 0;
      }
      var res = [];
      for (var index = 0; index < Math.ceil(this.notes.size / 2); index++) {
        res.push(index);
      }
      return res;
    },
    vsort: function() {
      var res = this.ss;
      if (res !== '') {
        if (this.sort_r === true) {
          res += '_R';
        }
      }
      return res;
    },
  },
  methods: {
    showInfo: function(info) {
      $('#info').html(info);
      $('#InfoModal').modal('show');
    },
    updateCategory: function() {
      var vm = this;
      axios.get('/api/note/categories').then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.category = {
            list: data.keys,
            data: data.data
          }
          var c = vm.category;
          for (var elem in c.list) {
            $('#NoteInput3').append($('<option value="' + c.data[c.list[elem]] + '">' + c.list[elem] + '</option>'));
          }
          $("#NoteInput3").val(3);
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    updateNotes: function() {
      var vm = this;
      axios.get('/api/note', {
        auth: this.user,
        params: {
          sort: this.vsort,
          search: this.search,
          flr_eq_favorite: this.getFlr('eq', 'favorite'),
          flr_nq_favorite: this.getFlr('nq', 'favorite'),
          flr_eq_category: this.getFlr('eq', 'category'),
          flr_nq_category: this.getFlr('nq', 'category'),
          flr_lt_time: this.getFlr('lt', 'timeEnd'),
          flr_gt_time: this.getFlr('gt', 'timeStart')
        }
      }).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.notes = {
            data: data.data,
            size: data.size
          }
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    login: function(name, passwd) {
      this.user = {
        username: name,
        password: passwd
      };
      this.check();
    },
    logout: function() {
      this.user = null;
      this.check();
    },
    check: function() {
      if (this.user === null) {
        this.logged = false;
      } else {
        var vm = this;
        axios.get(
          '/api/check', {
            auth: this.user
          }
        ).then(function(response) {
          var data = response.data;
          if (data.result == 'success') {
            vm.logged = true;
          } else {
            vm.logged = false;
          }
          if (vm.logged === false) {
            if (data.description == 'User not found'){
              vm.showRegister();
            } else {
              vm.showInfo(data.description);
            }
          } else {
            vm.updateCategory();
            vm.updateNotes();
          }
        }).catch(function(error) {
          console.warn(error);
          vm.logged = false;
        });
      }
    },
    saveSettings: function() {
      var newUsername = $('#SettingsModalInput1').val();
      $('#SettingsModal').modal('hide');
      var vm = this;
      if (newUsername != this.user.username) {
        axios.post(
          '/api/user', {
            nUsername: newUsername
          }, {
            auth: vm.user
          }
        ).then(function(response) {
          data = response.data;
          if (data.result == 'success') {
            vm.user.username = newUsername;
            vm.check();
          } else {
            vm.showInfo(newUsername + ' is not free');
          }
        }).catch(function(error) {
          console.warn(error);
        });
      }
    },
    showSettings: function() {
      $('#SettingsModal').modal('show');
      $('#SettingsModalInput1').val(this.user.username);
      $('#SettingsModalButtonSave').unbind('click');
      $('#SettingsModalButtonSave').bind('click', this.saveSettings);
    },
    savePassword: function() {
      var voldPassword = $('#ChangePasswordInput1').val();
      $('#ChangePasswordInput1').val('');
      var vnewPassword = $('#ChangePasswordInput2').val();
      $('#ChangePasswordInput2').val('');
      var vnewPassword2 = $('#ChangePasswordInput3').val();
      $('#ChangePasswordInput3').val('');
      $('#ChangePasswordModal').modal('hide');
      var vm = this;
      if ((vnewPassword == vnewPassword2) && (vnewPassword != voldPassword)) {
        axios.post(
          '/api/user', {
            oldPassword: voldPassword,
            newPassword: vnewPassword
          }, {
            auth: vm.user
          }
        ).then(function(response) {
          data = response.data;
          if (data.result == 'success') {
            vm.user.password = vnewPassword;
            vm.check();
          } else {
            if ('description' in data) {
              vm.showInfo(data.description);
            }
          }
        }).catch(function(error) {
          console.warn(error);
        });
      }
    },
    showPassword: function() {
      $('#ChangePasswordModal').modal('show');
      $('#ChangePasswordButtonSave').unbind('click');
      $('#ChangePasswordButtonSave').bind('click', this.savePassword);
    },
    saveDelete: function() {
      $('#DeleteModal').modal('hide');
      var vm = this;
      axios.delete(
        '/api/user', {
          auth: this.user
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.user = null;
          vm.check();
        } else {
          vm.showInfo('Deleting account failed');
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    showDelete: function() {
      $('#DeleteModal').modal('show');
      $('#DeleteButtonSave').unbind('click');
      $('#DeleteButtonSave').bind('click', this.saveDelete);
    },
    saveRegister: function() {
      $('#RegisterModal').modal('toggle');
      var name = $('#LoginInputUsername').val();
      var passwd = $('#LoginInputPassword1').val();
      var vm = this;
      axios.put(
        '/api/register', {
          nUsername: name,
          newPassword: passwd
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.login(name, passwd);
        } else {
          if ('description' in data) {
            vm.showInfo(data.description);
          }
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    showRegister: function() {
      $('#RegisterModal').modal('show');
      $('#RegisterButtonSave').unbind('click');
      $('#RegisterButtonSave').bind('click', this.saveRegister);
    },
    showEdit: function() {
      $('#edit').show();
      $('#preview').hide();
    },
    showPreview: function() {
      $('#edit').hide();
      $('#preview').show();
      $('#preview-title').text($('#NoteInput1').val());
      axios.post('/api/utils/markdown', {
        target: $('#NoteInput2').val()
      }).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          $('#preview-text').html(data.data);
        } else {
          $('#preview-text').text('Error');
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    saveNote: function() {
      $('#NoteModal').modal('hide');
      var vid = $('#NoteInput4').val();
      var vm = this;
      var vtitle = $('#NoteInput1').val();
      var vtext = $('#NoteInput2').val();
      var vcategory = $('#NoteInput3').val();
      if (vid == -1) {
        axios.put(
          '/api/note', {
            nTitle: vtitle,
            nText: vtext,
            nCategory: vcategory
          }, {
            auth: this.user
          }
        ).then(function(response) {
          data = response.data;
          if (data.result == 'success') {
            vm.updateNotes();
          } else {
            if (data.description !== undefined) {
              vm.showInfo(data.description);
            }
          }
        }).catch(function(error) {
          console.warn(error);
        });
      } else {
        axios.post(
          '/api/note', {
            id: vid,
            nTitle: vtitle,
            nText: vtext,
            nCategory: vcategory
          }, {
            auth: vm.user
          }
        ).then(function(response) {
          data = response.data;
          if (data.result == 'success') {
            vm.updateNotes();
          } else {
            if (data.description !== undefined) {
              vm.showInfo(data.description);
            }
          }
        }).catch(function(error) {
          console.warn(error);
        });
      }
    },
    showNote: function() {
      $('#NoteModal').modal('show');
      $('#NoteButton1').unbind('click');
      $('#NoteButton1').bind('click', this.showEdit);
      $('#NoteButton2').unbind('click');
      $('#NoteButton2').bind('click', this.showPreview);
      $('#NoteButtonSave').unbind('click');
      $('#NoteButtonSave').bind('click', this.saveNote);
      this.showEdit();
    },
    loginForm: function() {
      var username = $('#LoginInputUsername').val();
      var passwd = $('#LoginInputPassword1').val();
      if ($('#LoginCheck1').val()) {
        $.cookie('username', username);
        $.cookie('passwd', passwd);
      }
      if ((username !== '') && (passwd !== '')) {
        this.login(username, passwd);
      }
    },
    loginCookies: function() {
      $('#LoginInputUsername').val($.cookie('username'));
      $('#LoginInputPassword1').val($.cookie('passwd'));
      this.loginForm();
    },
    findCategory: function(num) {
      for (var key in this.category.data) {
        if (this.category.data[key] == num) {
          return key;
        }
      }
      return 'NONE';
    },
    deleteNote: function(pid) {
      var vm = this;
      axios.patch(
        '/api/note', {
          id: pid
        }, {
          auth: this.user
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.updateNotes();
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    setFavoriteNote: function(pid, pval = false) {
      var vm = this;
      axios.post(
        '/api/note', {
          id: pid,
          nFavorite: pval
        }, {
          auth: this.user
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          vm.updateNotes();
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    editNote: function(id) {
      var vm = this;
      axios.get(
        '/api/note', {
          auth: vm.user,
          params: {
            flr_eq_id: id
          }
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          var note = data.data[0];
          $('#NoteInput4').val(note.id);
          $('#NoteInput1').val(note.title);
          $('#NoteInput2').val(note.markdown);
          $("#NoteInput3").val(note.category);
          vm.showNote();
        } else {
          if (data.description !== undefined) {
            vm.showInfo(data.description);
          }
        }
      }).catch(function(error) {
        console.warn(error);
      })
    },
    createNote: function() {
      $('#NoteInput4').val(-1);
      $('#NoteInput1').val('');
      $('#NoteInput2').val('');
      $("#NoteInput3").val(3);
      this.showNote();
    },
    shareNote: function(pid) {
      var vm = this;
      axios.post(
        '/api/note/share', {
          id: pid
        }, {
          auth: this.user
        }
      ).then(function(response) {
        data = response.data;
        if (data.result == 'success') {
          $('#ShareModal').modal('show');
          $('#ShareH1').text(window.location.host + data.url);
          $('#ShareH1').attr('href', window.location.host + data.url);
        } else {
          if (data.description !== undefined) {
            vm.showInfo(data.description);
          }
        }
      }).catch(function(error) {
        console.warn(error);
      });
    },
    sort: function(vs) {
      if (this.ss != vs) {
        this.ss = vs;
      } else {
        this.ss = '';
      }
    },
    getFlr: function(oper, target) {
      if (this.flr[oper][target] !== null) {
        return this.flr[oper][target];
      } else {
        return '';
      }
    },
    setCategoryFlr: function(value) {
      var flr = this.flr;
      if (flr.nq.category == value) {
        flr.nq.category = null;
        flr.eq.category = null;
      } else {
        if (flr.eq.category != value) {
          flr.eq.category = value;
          flr.nq.category = null;
        } else {
          flr.eq.category = null;
          flr.nq.category = value;
        }
      }
      this.updateNotes();
    },
    getCategoryFlr: function () {
      var flr = this.flr;
      if (flr.eq.category !== null) {
        return flr.eq.category;
      } else {
        return flr.nq.category;
      }
    },
    setFavoriteFlr: function (value) {
      var flr = this.flr;
      if (flr.eq.favorite == value) {
        flr.eq.favorite = null;
      } else {
        flr.eq.favorite = value;
      }
      this.updateNotes();
    },
    getFavoriteFlr: function () {
      return this.flr.eq.favorite;
    },
    setTimeFlr: function (id, target) {
      var val = $('#' + id).val();
      if (target == 'lt') {
        if (val === '') {
          this.flr.lt.timeEnd = null;
        } else {
          console.log(id + ' ' + val);
          val = moment(val, moment.HTML5_FMT.DATETIME_LOCAL);
          val.utc();
          val = val.format('Y|M|D|H|m|0').toString();
          console.log(id + ' ' + val);
          this.flr.lt.timeEnd = val;
        }
      } else {
        if (val === '') {
          this.flr.gt.timeEnd = null;
        } else {
          console.log(id + ' ' + val);
          val = moment(val, moment.HTML5_FMT.DATETIME_LOCAL);
          val.utc();
          val = val.format('Y|M|D|H|m|0').toString();
          console.log(id + ' ' + val);
          this.flr.gt.timeStart = val;
        }
      }
      this.updateNotes();
    },
    updateTimeFlrs: function (lg=true) {
      if (lg === true) {
        this.setTimeFlr('FlrDateTimeInput1-lg', 'gt');
        this.setTimeFlr('FlrDateTimeInput2-lg', 'lt');
      } else {
        this.setTimeFlr('FlrDateTimeInput1', 'gt');
        this.setTimeFlr('FlrDateTimeInput2', 'lt');
      }
    }
  }
});